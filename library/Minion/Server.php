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
 * A server, containing one or more domains/hosts, provided by one or more
 * Minion_Source objects.
 */
class Minion_Server implements Minion_Task_ParentInterface
{
    /**
     * The server-specific configuration
     *
     * @var Zend_Config
     */
    protected $_config;

    /**
     * The object responsible for sending notifications once all tasks have been
     * completed.
     *
     * @var Minion_ResultNotifier
     */

    /**
     * The server's name.  Any string that helps you remember the server.  Could
     * be an IP address, sci-fi character, or model number.
     *
     * @var string
     */
    protected $_name;

    /**
     * A collection of Minion_Domain objects associated with this server.
     *
     * @var array
     */
    protected $_domains = array();

    protected $_db;

    private $_tasks = array();

    /**
     * Initialize the server, iterating through any declared sources to get the
     * associated domains.
     *
     * Domains returned from the sources are stored in an associated array with
     * the domain's names used as keys.  This is done so that a source can 
     * override a domain definition from a previous source.  For example, you
     * could provide a Plesk source and a Manual source to your server.  The
     * Plesk source might detect the domain example.com and add to the server.
     * However, you may want to adjust the settings detected by Plesk.  To do
     * so, you'd enter the same domain in the manual source.
     *
     * @param Zend_Config $config The server's config.
     * @param string The server's name.
     */
    public function __construct(
        $name,
        MongoDB $db,
        Zend_Config $config, 
        Minion_ResultNotifier $resultNotifier
    )
    {
        $this->_config = $config;
        $this->_name   = $name;
        $this->_db     = $db;

        $this->_resultNotifier = $resultNotifier;

        $db->servers->ensureIndex(array('name' => 1));

        $query = array('name' => $this->_name);

        // Store in DB if it isn't already there
        if (! $db->servers->findOne($query)) {
            $data = array(
                'name'     => $this->_name,
                'hostname' => $this->_config->hostname
            );

            $db->servers->insert($data);
        }

        if (Minion_Config::isConfig($config->tasks)) {
            $this->_createTasks($db);
        }

        if (Minion_Config::isConfig($config->sources)) {
            $this->_processSources($db);
        }
    }

    /**
     * Get the server's hostname.
     *
     * @todo Use this to test network connectivity.
     *
     * @return string
     */
    public function getHostname()
    {
        return $this->_config->hostname;
    }

    /**
     * Get the server's name
     *
     * @return string
     */
    public function getName()
    {
        return $this->_name;
    }

    public function hasTask($taskName)
    {
        return isset($this->_tasks[$taskName]);
    }

    public function runTasks()
    {
        if (! Minion_Config::isEnabled($this->_config)) {
            return;
        }

        foreach ($this->_tasks as $task) {
            $this->_resultNotifier->add($task->run());
        }

        foreach ($this->_domains as $domain) {
            $domain->runTasks($this->_resultNotifier);
        }

        $this->_tasks = array();
    }

    private function _createTasks(MongoDB $db)
    {
        foreach ($this->_config->tasks as $name => $config) {
            $task = Minion_Task::factory(
                $name, 
                Minion_Config::merge($this->_config, $config),
                $db
            );

            if ($task instanceof Minion_Task_Abstract_Server) {
                $name = $task->getName();
                $this->_tasks[$name] = $task;
                $task->setParent($this);
            }
        }
    }

    private function _processSources(MongoDB $db)
    {
        foreach ($this->_config->sources as $name => $config) {
            $source = Minion_Source::factory(
                $name, 
                $this, 
                $db,
                Minion_Config::merge($this->_config, $config)
            );

            try {
                foreach ($source->getDomains() as $domain) {
                    $name = $domain->getName();
                    $this->_domains[$name] = $domain;
                }

                $message = 'Successfully retrieved domain list.';

                $result = new Minion_Result($db, true, $message);

                $task = new Minion_Task_Source($db, new Zend_Config(array()));
                $task->setParent($this);

                $result->setTask($task)
                       ->log();

                $this->_resultNotifier->add($result);
            } catch (Exception $e) {
                echo $e->getMessage() . PHP_EOL;
                //$message = "Error while retrieving domains from '{$source->getName()}' "
                         //. "on '{$this->getName()}': " . $e->getMessage();

                //$result = new Minion_Result(false, $message);

                //$task = new Minion_Task_Source(new Zend_Config(array()));
                //$task->setParent($this);

                //$result->setTask($task)
                       //->log();

                //$this->_resultNotifier->add($result);
            }
        }
    }
    
    public function setStatus(Minion_Task_Abstract $task, $status, $time)
    {
        $this->_db->servers->update(
            array(
                'name' => $this->_name
            ),
            array(
                '$set' => array(
                    "tasks.{$task->getName()}" => array(
                        'status' => $status,
                        'time'   => $time
                    )
                )
            )
        );        
    }
}
