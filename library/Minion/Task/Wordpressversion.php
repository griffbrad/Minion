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
 * A task to ensure that a domain is running the current version of WordPress.
 * To run properly this task needs the XML-RPC API to be enabled in WordPress.
 * In recent versions, this is done by going to Setting >> Write in the admin
 * and then selecting to enable the API.
 *
 * Currently, this task uses a crude method of determining what the current
 * version of WordPress is.  It looks at the list of tag's from the project's
 * Subversion repository and picks the last tag.
 * 
 * @todo Update this so that the XMLRPC addresses, etc., are part of the config
 *       but with sensible defaults.
 */
class Minion_Task_Wordpressversion extends Minion_Task_Abstract_Domain
{
    /**
     * Check the version of WordPress to ensure it's fully updated.
     */
    public function main()
    {
        $domain = $this->getParent();
        $config = $this->getConfig();
        $uri    = 'http://' . $domain->getName() . '/xmlrpc.php';
        $client = new Zend_XmlRpc_Client($uri);
        
        $blogs = $client->call(
            'wp.getUsersBlogs',
            array(
                $config->account->username,
                $config->account->password
            )
        );
       
        $result = Minion_Result::SUCCESS;

        foreach ($blogs as $blog) {
            $response = $client->call(
                'wp.getOptions',
                array(
                    $blog['blogid'],
                    $config->account->username,
                    $config->account->password,
                    array(
                        'software_version'
                    )
                )
            );

            $current = $response['software_version']['value'];
            $latest  = $this->_getLatestVersion();

            if (version_compare($current, $latest, '<')) {
                $result = Minion_Result::FAILURE;
            }
        }

        return $result;
    }

    /**
     * Retrieve the latest version of WordPress from their list of tags in SVN.
     *
     * @return string The current version.
     */
    private function _getLatestVersion()
    {
        try {
            $html = file_get_contents(
                'http://core.svn.wordpress.org/tags/'
            );

            $dom = new DOMDocument();
            $dom->loadHTML($html);

            $ul = $dom->getElementsByTagName('ul')->item(0);
            $a  = $ul->lastChild->previousSibling->nodeValue;

            return trim(rtrim($a, '/'));
        } catch (Exception $e) {
            throw new Minion_Task_Exception(
                'Could not determine latest WordPress version'
            );
        }
    }
}
