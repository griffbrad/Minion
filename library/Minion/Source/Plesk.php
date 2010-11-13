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
 * A source to retrieve domains from a Plesk database.  This source will 
 * actually make a connection to the remote MySQL daemon to perform this
 * query, so you will need to grant access from the IP of the machine
 * running minion.  To do this, you'd run a command similar to the following
 * on the remote MySQL server:
 *
 * GRANT SELECT ON psa.domains TO 'username'@'xxx.xxx.xxx.xxx'
 *     IDENTIFIED BY 'password';
 */
class Minion_Source_Plesk extends Minion_Source_Abstract
{
    const DISABLED_DOMAIN = 16;

    /**
     * Default configuration for this source.  Sets the Plesk database name to
     * "psa".
     *
     * @var array
     */
    protected $_defaults = array(
        'mysql' => array(
            'dbname' => 'psa'
        )
    );

    protected $_dbAdapter;

    /**
     * Retrieve domains from the Plesk database.
     */
    protected function _getDomainsInternal()
    {
        $db   = $this->_getDbAdapter();
        $stmt = $db->select();

        $stmt->from(array('d' => 'domains'), array('name'))
             ->join(array('h' => 'hosting'), 
                    'h.dom_id = d.id',
                    array('ssl'))
             ->where('status != ?', self::DISABLED_DOMAIN)
             ->order('name');

        foreach ($db->fetchAll($stmt) as $row) {
            $domain = $this->_addDomain($row['name']);

            // Ensure domain wasn't excluded
            if (! $domain) {
                continue;
            }

            // Plesk uses an ENUM of 'true'/'false' for this.  Wow.
            if ('false' === $row['ssl']) {
                $domain->setHasSsl(false);
            } else if ('true' === $row['ssl']) {
                $domain->setHasSsl(true);
            }
        }
    }


    /**
     * Get the database adapter to be used for retrieving domain names from
     * Plesk.
     *
     * @return Zend_Db_Adapter_Pdo_Mysql
     */
    protected function _getDbAdapter()
    {
        if (! $this->_dbAdapter) {
            $this->_dbAdapter = new Zend_Db_Adapter_Pdo_Mysql(array(
                'host'     => $this->getServer()->getHostname(),
                'username' => $this->getConfig()->mysql->username,
                'password' => $this->getConfig()->mysql->password,
                'dbname'   => $this->getConfig()->mysql->dbname
            ));
        }

        return $this->_dbAdapter;
    }
}
