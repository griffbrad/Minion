<?php

/**
 * Copyright (c) 2009, Brad Griffith <griffbrad@gmail.com>
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without 
 * modification, are permitted provided that the following conditions are met:
 * 
 * - Redistributions of source code must retain the above copyright notice, 
 *   this list of conditions and the following disclaimer.
 * - Redistributions in binary form must reproduce the above copyright notice, 
 *   this list of conditions and the following disclaimer in the documentation 
 *   and/or other materials provided with the distribution.
 * - Neither the name of Brad Griffith nor the names of other contributors may 
 *   be used to endorse or promote products derived from this software without
 *   specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE 
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE 
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE 
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR 
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF 
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS 
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN 
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) 
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF 
 * THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * Domains provide an abstraction for individual VirtualHosts or sites on a 
 * server.  Many tasks operate on domains, like HttpStatus checks and the
 * Safe Browser malware check.
 */
class Minion_Domain implements Minion_Task_ParentInterface
{
    /**
     * The domain name. (e.g. example.com)
     *
     * @var string
     */
    protected $_name;

    /**
     * The server this domain is tied to.
     *
     * @var Minion_Server
     */
    protected $_server;

    /**
     * The configuration for this domain.  Can override server notification
     * or task settings, etc.
     *
     * @var Zend_Config
     */
    protected $_config;

    protected $_hasSsl = false;

    private $_db;

    /**
     * Constructor.  Initializes domain and stores it in the database.
     *
     * @param string $name The domain name, which will always be stored in 
     *                     lowercase.
     * @param Minion_Server $server The server the domain belongs to.
     * @param Zend_Config | null $config The domain-specific config.
     */
    public function __construct($name, Minion_Server $server, MongoDb $db, 
        $config = null)
    {
        $this->_name   = strtolower($name);
        $this->_server = $server;
        $this->_db     = $db;

        if ($config instanceof Zend_Config) {
            $this->_config = $config;
        } else {
            $this->_config = new Zend_Config(array());
        }
        
        $db->domains->ensureIndex(array('name' => 1));
        $db->domains->ensureIndex(array('servers' => 1));

        $query  = array('name' => $this->_name);
        $domain = $db->domains->findOne($query);

        if (! $domain) {
            $data = array(
                'name'    => $this->_name,
                'servers' => array(
                    $server->getName()
                )
            );

            $db->domains->insert($data);

            $domain = $db->domains->findOne($query);
        }

        if (! in_array($this->_server->getName(), $domain['servers'])) {
            $db->domains->update(
                array('name'  => $this->_name),
                array('$push' => array('servers' => $this->_server->getName()))
            );
        }
    }

    public function runTasks(Minion_ResultNotifier $resultNotifier)
    {
        if (! Minion_Config::isEnabled($this->_config)
            || ! Minion_Config::isConfig($this->_config->tasks)) {

            return;
        }

        foreach ($this->_config->tasks as $name => $config) {
            if ($this->_server->hasTask($name)) {
                continue;
            }

            $task = Minion_Task::factory(
                $name, 
                Minion_Config::merge($this->_config, $config),
                $this->_db
            );

            if ($task instanceof Minion_Task_Abstract_Server) {
                throw new Minion_Exception('Server task assigned to domain.');
            }

            $task->setParent($this);

            $resultNotifier->add($task->run());
        }
    }

    /**
     * Retrieve domain name
     *
     * @return string
     */
    public function getName()
    {
        return $this->_name;
    }

    /**
     * Retrieve associated server
     *
     * @return Minion_Server
     */
    public function getServer()
    {
        return $this->_server;
    }

    public function setHasSsl($hasSsl)
    {
        $this->_hasSsl = $hasSsl;
        return $this;
    }

    public function getHasSsl()
    {
        return $this->_hasSsl;
    }

    public function setStatus(Minion_Task_Abstract $task, $status, $time)
    {
        $domain = $this->_db->domains->findOne(array('name' => $this->_name));

        $data = array(
            'status' => $status,
            'time'   => $time
        );

        if (isset($domain['tasks'][$task->getName()])) {
            $taskStatus = $domain['tasks'][$task->getName()];

            if (! $taskStatus['status'] != $status) {
                $data['changeTime'] = $time;
                $data['repeats']    = 0;
            } else {
                $data['changeTime'] = $taskStatus['changeTime'];
                $data['repeats']    = $taskStatus['repeats'] + 1;
            }
        }

        $this->_db->domains->update(
            array(
                'name' => $this->_name
            ),
            array(
                '$set' => array(
                    "tasks.{$task->getName()}" => $data
                )
            )
        ); 
    }
}
