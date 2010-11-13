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
 * A base class for domain sources.  This base class provides a very good 
 * foundation for sub-classes, so that they only need to implement the
 * _getDomainsInternal() method to integrate with the rest of Minion.
 *
 * All sources support exclusion of some specified domains.  Sub-classes can
 * override the logic for this feature if they'd like to exclude hosts based
 * on criteria other than manual entry in the configuration file.
 */
abstract class Minion_Source_Abstract
{
    /**
     * Default configuration for this source.  If there are any configuration
     * options likely to be consistent across deployments of Minion (e.g. the
     * Plesk database is almost always "psa"), you can specify them in your
     * sub-class.
     * 
     * @var array
     */
    protected $_defaults = array();

    /**
     * The server associated with this source.
     *
     * @var Minion_Server
     */
    private $_server;

    /**
     * The source's configuration
     *
     * @var Zend_Config
     */
    private $_config;

    /**
     * Domains retrieved by this source.
     *
     * @var array
     */
    private $_domains = array();

    /**
     * Domains to exclude during retrieval.
     *
     * @var null | array
     */
    private $_exclude;

    /**
     * The name of this source.  This is detected by retrieving the section of
     * the source's class name following the final underscore.
     *
     * @var string
     */
    private $_name;

    private $_db;

    /**
     * Initialize source and store in DB if not there already.
     *
     * @param Minion_Server $server The server associated with the source.
     * @param Zend_Config $config Configuration for the source.
     */
    public function __construct(Minion_Server $server, MongoDB $db, 
        Zend_Config $config)
    {
        $this->_db     = $db;
        $this->_server = $server;
        $this->_config = Minion_Config::merge(
            new Zend_Config($this->_defaults),
            $config
        );


        //$db = new Zend_Db_Table('sources');

        //if (! $db->find($this->getName())->current()) {
            //$row = $db->createRow();
            //$row->source = $this->getName();
            //$row->save();
        //}

        //$xref = new Zend_Db_Table('server_sources');

        //if (! $xref->find($server->getName(), $this->getName())->current()) {
            //$row = $xref->createRow();
            //$row->server = $server->getName();
            //$row->source = $this->getName();
            //$row->save();
        //}

        $this->init();
    }

    /**
     * Allow sources to perform any needed initialization logic.
     */
    public function init()
    {

    }
    
    /**
     * Retrieve the name of the source.  Auto-detected as the lowercased portion
     * of the classname following the last underscore (e.g. In
     * Minion_Source_Plesk, the source's name would be "plesk").
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

    /**
     * Get the source's server
     *
     * @return Minion_Server
     */
    public function getServer()
    {
        return $this->_server;
    }

    /**
     * Get the sources's config
     *
     * @return Zend_Config
     */
    public function getConfig()
    {
        return $this->_config;
    }

    /**
     * Retrieve the domains associated with this source.
     *
     * @return array
     */
    public function getDomains()
    {
        if (! Minion_Config::isEnabled($this->_config)) {
            return array();
        }
        
        $this->_getDomainsInternal();

        return $this->_domains;
    }

    /**
     * A method for sub-classes to implement to retrieve domains according
     * to whatever requirements they're attempting to fulfill.  For example,
     * the Plesk source would use this method to query the Plesk database for
     * domains and add them.  The manual source, on the other hand, loops 
     * through the "hosts" section of its config in this method to find domains.
     */
    abstract protected function _getDomainsInternal();
   
    /**
     * This method should be called by sub-classes to add their domains to the
     * source.  This method ensures that only Minion_Domain objects are stored
     * in the source and implements the exclusion logic in a consistent manner.
     *
     * @var string $domain The name of the domain to add.
     * @var Zend_Config | null $config Any per-domain configuration to add.
     */
    protected function _addDomain($domain, $config = null)
    {
        if ($this->_domainIsExcluded($domain)) {
            return false;
        }

        $domain = new Minion_Domain(
            $domain, 
            $this->getServer(),
            $this->_db,
            Minion_Config::merge($this->_config, $config)
        );

        $this->_domains[] = $domain;

        return $domain;
    }

    /**
     * Detect whether a domain should be excluded (i.e. prevented from being
     * added to this source.
     *
     * @var Minion_Domain $domain
     *
     * @return boolean
     */
    protected function _domainIsExcluded($domainName)
    {
        if (! $this->_exclude) {
            $this->_exclude = $this->_getExcludes();

            if (! is_array($this->_exclude)) {
                throw new Minion_Source_Exception(
                    "_getExcludes() in {$this->getName()} source must return "
                  . 'an array.'
                );
            }
        }

        return in_array($domainName, $this->_exclude);
    }

    /**
     * Get the list of domains to exclude from this source.  All sources by
     * default can handle an <exclude></exclude> section in their config that
     * lists domains to be excluded.  Sub-classes may implement their own
     * exclusion logic, though, if needed.
     *
     * @return array An array of Minion_Domain objects to exclude
     */
    protected function _getExcludes()
    {
        if (! isset($this->getConfig()->exclude) 
            || ! $this->getConfig()->exclude instanceof Zend_Config) {

            return array();
        }

        return array_keys($this->_config->exclude->toArray());
    }
}
