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
 * A simple base task class that setups up a lot of the structure for a task but
 * provides no main() method at all, which is the primary interaction point
 * between the task and its server.  There are other abstract task classes that
 * have main() methods suited to common scenarios, such as 
 * Minion_Task_Abstract_Domain and Minion_Task_Abstract_Server.
 */
abstract class Minion_Task_Abstract
{
    /**
     * Any default configuration options for this task.  For example, a task
     * using a Web service might specify the service's URL as a default option.
     *
     * @var array
     */
    protected $_defaults = array();

    private $_config;

    /**
     * The name of the task.  This is detected from the class name.  It is the
     * lower-case version of the portion of the class name following the final
     * underscore.
     *
     * @var string
     */
    private $_name;

    /**
     * The parent object that runs this task.
     *
     * @var Minion_Task_ParentInterface
     */
    private $_parent;

    private $_schedule;

    /**
     * The result of running this task.
     *
     * @var Minion_Result
     */
    private $_result;

    protected $_db;

    private static $_initConfig;

    /**
     * Intiailize the task, storing it in the database if it isn't already
     * there.
     *
     * @param Zend_Config $config
     */
    public function __construct(MongoDb $db, Zend_Config $config, $parent)
    { 
        $this->_db = $db;

        $this->setParent($parent);

        $this->_config = Minion_Config::merge(
            new Zend_Config($this->_defaults),
            $config
        );

        foreach ($this->_config as $key => $value) {
            $method = 'set' . ucfirst($key);

            if (method_exists($this, $method)) {
                $this->$method($value);
            }
        }

        $this->_result = Minion_Result::failure($db);

        $this->_result->setTask($this);
    }

    public function setParent(Minion_Task_ParentInterface $parent)
    {
        $this->_parent = $parent;
        return $this;
    }

    public function getParent()
    {
        return $this->_parent;
    }

    public function run()
    {
        if (! Minion_Config::isEnabled($this->_config)) {
            return Minion_Result::TASK_ABORTED_CLEANLY;
        }

        try {
            if (! $this->_parent) {
                throw new Minion_Task_Exception(
                    'Parent must be set before running task.'
                );
            }

            if (! $this->_initHasBeenRun($this->_config)) {
                self::$_initConfig = $this->_config;
                $this->init();
            }

            $out = $this->main();

            if (Minion_Result::TASK_ABORTED_CLEANLY === $out) {
                return $out;
            }

            $this->_result->setValue($out);
        } catch (Exception $e) {
            $this->_result->setException($e);
            echo $this->getName() . ': ' . $e->getMessage() . PHP_EOL;
        }

        $this->_result->log();

        return $this->_result;
    }

    /**
     * Perform any global initialization needed for this task, such as setting
     * up the task's result object.
     */
    public function init()
    {

    }

    /**
     * The primary execution path for this task.  This is the function called
     * by the server or domain when the task is actually run.
     */
    abstract public function main();

    /**
     * Get the default configuration options for this task.
     *
     * @return Zend_Config
     */
    public function getDefaults()
    {
        return new Zend_Config($this->_defaults);
    }

    public function getConfig()
    {
        return $this->_config;
    }

    public function getResult()
    {
        return $this->_result;
    }

    public function shouldRun()
    {
        if (! $this->_schedule) {
            return true;
        }

        return $this->_schedule->shouldRun();
    }

    public function setSchedule($text)
    {
        $status = $this->getParent()->getStatus($this);

        $this->_schedule = new Minion_Schedule(
            $text, 
            $status
        );

        return $this;
    }

    /**
     * Get the task's name, the lower-case version of the portion of the class
     * name following the final underscore.
     *
     * @return string
     */
    public function getName()
    {
        if ($this->_name) {
            return $this->_name;
        }

        $className = get_class($this);
        $suffix    = substr($className, strrpos($className, '_') + 1);

        return strtolower($suffix);
    }

    public function resultHasChanged($limit)
    {
        $hardState = $this->_getCurrentHardState($limit);

        if (null === $hardState) {
            return false;
        }
  
        $repeats = 0;
        $results = $this->_getRecentResults(0, $limit);

        foreach ($results as $result) {
            if ($result->success !== $hardState) {
                $repeats++;
            }
        }

        return $repeats === (int) $limit;
    }

    abstract protected function _getRecentResults($offset, $limit = 100);

    protected function _getCurrentHardState($limit)
    {
        $hardState = null;
        $offset    = $limit;
        $current   = null;
        $repeats   = 0;

        while (null === $hardState) {
            $results  = $this->_getRecentResults($offset);
            $offset  += 100;

            if (isset($results)) {
                foreach ($results as $result) {
                    if ($result->success === $current) {
                        $repeats++;
                    } else {
                        $current = $result->success;
                        $repeats = 1;
                    }
                    
                    if ($repeats === (int) $limit) {
                        $hardState = $result->success;
                        break;
                    }
                }
            }

            if (! isset($results) || 100 > count($results)) {
                break;
            }
        }

        return $hardState;
    }

    private function _initHasBeenRun(Zend_Config $config)
    {
        return Minion_Config::isEquivalent(self::$_initConfig, $config);
    }
}
