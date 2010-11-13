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
 * A base class for all clients.  Creates the database connection and loads the
 * configuration file.
 */
abstract class Minion_Client_Abstract
{
    /**
     * Zend_Db adapter
     *
     * @var Zend_Db_Adapter
     */
    private $_db;

    /**
     * Application configuration
     *
     * @var Zend_Config
     */
    private $_config;

    /**
     * Start the application, connect to the database, and load the
     * configuration.
     *
     * @param Zend_Config $config Optionally provide a config manually rather
     *                            than detecting and loading in the client.
     */
    public function __construct(Zend_Config $config = null)
    {
        try {
            $this->_config = ($config) ? $config : $this->_loadConfig();

            $mongo = new Mongo($this->_config->db->host);

            $this->_db = $mongo->minion;

            $collections = $this->_db->listCollections();

            if (! in_array('log', $collections)) {
                $this->_db->createCollection(
                    'log',
                    true,
                    104000000 // 100M log size
                );
            }

            $this->init();
        } catch (Exception $e) {
            $this->_handleException($e);
        }
    }

    /**
     * Allow client's to perform some of their own initialization, if needed.
     */
    public function init()
    {
        
    }

    public function getConfig()
    {
        return $this->_config;
    }

    public function getDb()
    {
        return $this->_db;
    }

    /**
     * Load the configuration file.
     * 
     * @return Zend_Config_Xml
     */
    protected function _loadConfig()
    {
        return new Zend_Config_Xml(
            $this->_detectConfig(),
            null
        );
    }

    abstract protected function _detectConfig();

    abstract protected function _handleException(Exception $e);
}
