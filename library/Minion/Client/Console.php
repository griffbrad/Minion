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
 * A client for handling requests from the console.
 *
 * This client doesn't produce any output and is generally intended to be run
 * from cron or another script.
 */
class Minion_Client_Console extends Minion_Client_Abstract
{
    /**
     * Detect servers from configuration file and setup notifications.
     */
    public function init()
    {
        Minion_Notification::setGlobalConfig($this->getConfig()->notifications);

        Minion_Task::setGlobalConfig($this->getConfig()->tasks);

        $config = new Zend_Config(array(
            'tasks'         => Minion_Task::getGlobalConfig()->toArray(),
            'notifications' => Minion_Notification::getGlobalConfig()->toArray()
        ));

        $resultNotifier = new Minion_ResultNotifier($config->notifications);

        foreach ($this->getConfig() as $name => $server) {
            if (! isset($server->hostname)) {
                continue;
            }

            $server = new Minion_Server(
                $name, 
                $this->getDb(),
                Minion_Config::merge($config, $server),
                $resultNotifier
            );

            $server->runTasks();
        }

        $resultNotifier->sendNotifications();
    }

    /**
     * Look for the config file, either as the first argument to this script,
     * or as config.xml in the current working directory.
     *
     * @throws Minion_Exception If no config file is found.
     *
     * @return string Path to configuration file.
     */
    protected function _detectConfig()
    {
        if (isset($_SERVER['argv'][1])) {
            $file = $_SERVER['argv'][1];
        } else {
            $file = getcwd() . '/config.xml';
        }

        if (!file_exists($file)) {
            throw new Minion_Exception(
                'Could not find configuration file.  You can place a '
              . 'file in the current folder, or you can specify the '
              . 'location of your configuration file as the first argument '
              . 'to minion.'
            );
        }

        return $file;
    }

    protected function _handleException(Exception $e)
    {
        echo $e->getFile() . ':' . $e->getMessage() . PHP_EOL;
        exit;
    }
}
