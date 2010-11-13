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
 * Check domains against Google's Safe Browsing blacklist and malware lists.
 *
 * To use this task, you'll need to get an API key from Safe Browsing site:
 * http://code.google.com/apis/safebrowsing/.  Provide the API key in your 
 * configuration file using the "apikey" field for this task.
 *
 * Once configured, the task will grab the latest malware and blacklist hashes
 * from Google.  This download will only be performed every half hour, in
 * accordance with Google's Safe Browsing terms of service.  
 *
 * This task probably only needs to be scheduled hourly or even daily to get
 * good results.
 */
class Minion_Task_Safebrowsing extends Minion_Task_Abstract_Domain
{
    /**
     * Configuration defaults.  Options for this task in your configuration
     * file with override these defaults.
     *
     * @var array
     */
    protected $_defaults = array(
        'uri'          => 'http://sb.google.com/safebrowsing/update',
        'client'       => 'api',
        'versionparam' => 'goog-black-hash:1:%s,goog-malware-hash:1:%s',

        // Additional options to pass to Zend_Http_Client
        'options' => array(
            'timeout' => 30
        )
    );

    /**
     * Zend_Db_Table objects for blacklist and malware entry tables.  These
     * are created in _init() to avoid having to create them on each iteration
     * of the domain loop.
     *
     * @var array
     */
    private $_entryTables = array();

    /**
     * Initialize the entry tables need for the domain loop in this task, and
     * update the malware and blacklist definitions from Google if they haven't
     * been updated in the last 30 minutes.
     */
    public function init()
    {
        $this->_entryTables = array(
            'malware'   => new Zend_Db_Table('safebrowsing_malware_entries'),
            'blacklist' => new Zend_Db_Table('safebrowsing_blacklist_entries') 
        );

        if ($this->_canUpdateLists()) {
            $this->_parseLists(
                $this->_downloadLists($this->getConfig())
            );
        }
    }

    /**
     * Check the given domain against the blacklist and malware list.  The
     * domain is checked with and without a "www" prefixed to it.
     *
     * @param Minion_Domain $domain The domain to check.
     *
     * @return boolean True if it is not on the list (safe), false if it is.
     */
    public function main()
    {
        $this->_entryTables = array(
            'malware'   => new Zend_Db_Table('safebrowsing_malware_entries'),
            'blacklist' => new Zend_Db_Table('safebrowsing_blacklist_entries') 
        );

        $domain = $this->getParent();
        $www    = null;
        $name   = $domain->getName();

        if (preg_match('/^www\./', $name)) {
            $www = preg_replace('/^www\./', '', $name);
        } else {
            $www = 'www.' . $name;
        }

        return $this->_queryDomain($www) && $this->_queryDomain($name);
    }

    /**
     * Query the database for using a hash of the provided domain.  The Google
     * API requires that a path be used in the query, so the root HTTP path
     * "/" is appended to the domain before checking.
     *
     * @param string $domain The domain to check.
     *
     * @return boolean Whether the test passed or failed.
     */
    protected function _queryDomain($domain)
    {
        $checksum = md5($domain . '/');

        if ($this->_checkEntryTables($checksum)) {
            return Minion_Result::FAILURE;
        } else {
            return Minion_Result::SUCCESS;
        }
    }

    /**
     * Check each of the entry tables in the database for a given hash.
     *
     * @param string $hash The hash to query for.
     *
     * @return boolean Whether the hash was found.
     */
    private function _checkEntryTables($hash)
    {
        $out = false;

        foreach ($this->_entryTables as $table) {
            $stmt = $table->select();

            $stmt->from($table, array('(true)'))
                 ->where('hash = ?', $hash);

            $out = $table->getAdapter()->fetchOne($stmt);
        }

        return (boolean) $out;
    }

    /**
     * Parse the list data from Google.
     *
     * Lines starting with "[" are the list names and version.  Lines starting
     * with "+" are hashes to be added to the list.  Lines starting with "-"
     * are hashes to be removed from the list.
     *
     * @param array $data Each line of the downloaded lists.
     */
    private function _parseLists(array $data)
    {
        $lists = array(
            'goog-black-hash'   => 'blacklist',
            'goog-malware-hash' => 'malware'
        );

        foreach ($data as $line) {
            $firstChar = substr($line, 0, 1);

            switch ($firstChar) {
            case '+' :
                $hash = substr($line, 1, 32);

                if (! $entryTable->find($hash)->current()) {
                    $row = $entryTable->createRow();
                    $row->hash = $hash;
                    $row->save();
                }
                break; 
            case '-' :
                $where = $entryTable->getAdapter()->quoteInto(
                    'hash = ?', substr($line, 1, 32)
                );
                $entryTable->delete($where);
                break;
            case '[' :
                $matches = array();

                preg_match(
                    '/^\[([a-x\-]+)\s+[0-9]\.([0-9]+)( update)?\]/', 
                    $line, 
                    $matches
                );

                if (! count($matches)) {
                    throw new Exception(
                        "{$line} is not a recognized list"
                    );
                } elseif (! isset($lists[$matches[1]])) {
                    throw new Exception(
                        "{$matches[1]} is not a recognized Safe Browsing list"
                    );
                }

                $logTable = new Zend_Db_Table(
                    "safebrowsing_{$lists[$matches[1]]}_log"
                );

                $logRow = $logTable->createRow();
                $logRow->version       = $matches[2];
                $logRow->download_time = new Zend_Date();
                $logRow->save();

                $entryTable = $this->_entryTables[$lists[$matches[1]]];
            }
        }
    }

    /**
     * Download the latest list updates from Google.
     *
     * @return array The lists stored as an array with one value per line.
     */
    private function _downloadLists()
    {
        $client = new Zend_Http_Client();
        
        $client->setUri($this->getConfig()->uri);

        $client->setParameterGet(array(
            'client'  => $this->getConfig()->client,
            'version' => $this->_getVersionParam(),
            'apikey'  => $this->getConfig()->apikey
        ));

        $response = $client->request();

        if (! $response->isSuccessful()) {
            // @todo Needs to use a minion exception class
            throw new Exception('Could not retrieve safebrowsing lists');
        }
        
        $data = explode("\n", $response->getBody());

        return $data;
    }

    /**
     * Get the version parameter for the query string of the request URL that
     * will be used to download list updates.
     *
     * The latest blacklist and malware versions are queried from the database.
     * If there aren't any entries in the log tables yet, the version is 
     * specified as -1, which in the Google API means to send the entire list.
     *
     * @return string
     */
    private function _getVersionParam()
    {
        $param  = $this->getConfig()->versionparam;
        $tables = array(
            'safebrowsing_blacklist_log',
            'safebrowsing_malware_log' 
        );

        $versions = array();

        foreach ($tables as $tableName) {
            $table = new Zend_Db_Table($tableName);
            $stmt  = $table->select();
            
            $stmt->from($table, array(new Zend_Db_Expr('MAX(version)')));

            $version = $table->getAdapter()->fetchOne($stmt);

            if (! $version) {
                $version = '-1';
            }

            $versions[] = $version;
        }
        
        return vsprintf($param, $versions);
    }

    /**
     * Check the most recent download times in the database to determine whether
     * we can download updated lists.  The Google terms of service allow 
     * downloads only every 30 minutes.
     *
     * @return boolean Whether updates can be downloaded.
     */
    private function _canUpdateLists()
    {
        $tables = array(
            'malware'   => true,
            'blacklist' => true
        );

        foreach ($tables as $tableName => $allowed) {
            $table = new Zend_Db_Table("safebrowsing_{$tableName}_log");
            $stmt  = $table->select();
                           
            $stmt->from($table, array(new Zend_Db_Expr('MAX(download_time)')));

            $time = $table->getAdapter()->fetchOne($stmt);

            if ($time) {
                $time = new Zend_Date($time, Zend_Date::ISO_8601);
                $time->add(30, Zend_Date::MINUTE);

                if ($time->isLater(new Zend_Date())) {
                    $tables[$tableName] = false;
                }
            }
        }
        
        return $tables['malware'] && $tables['blacklist'];
    }
}
