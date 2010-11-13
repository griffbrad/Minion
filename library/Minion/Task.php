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
 * A class for static properties, constants, and methods related to tasks.
 */
class Minion_Task
{
    /**
     * Global task configuration.  Applies to all servers, domains, etc.
     *
     * @var Zend_Config
     */
    private static $_config;

    /**
     * Create a task given a name from a configuration file.
     *
     * @param string $task The name of the task to create.
     * @param Minion_Server $server The server associated with the task.
     * @param Zend_Config $config The configuration for the task.
     *
     * @return Minion_Task_Abstract
     */
    public static function factory($task, Zend_Config $config, MongoDB $db)
    {
        $className = "Minion_Task_" . ucfirst($task);
        return new $className($db, $config);
    }

    /** 
     * Set global task configuration.
     *
     * @param Zend_Config $config
     */
    public static function setGlobalConfig($config)
    {
        if (! $config instanceof Zend_Config) {
            $config = new Zend_Config(array());
        }
    
        self::$_config = $config;
    }

    /**
     * Retrieve global task configuration.
     *
     * @return Zend_Config
     */
    public static function getGlobalConfig()
    {
        return self::$_config;
    }
}
