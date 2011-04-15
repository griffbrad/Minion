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
 * Ensure that the SMTP server responds to HELO
 */
class Minion_Task_Smtpstatus extends Minion_Task_Abstract_Domain
{
    /**
     * Configuration defaults.  Options for this task in your configuration
     * file with override these defaults.
     *
     * @var array
     */
    protected $_defaults = array(
        'options' => array(
            'timeout' => 30,
            'port'    => 25
        )
    );

    /**
     * Check the provided domain to ensure it returns a 200-level status.
     *
     * @param string $domain The domain to check.
     *
     * @return boolean Whether HTTP status is 200-level.
     */
    public function main()
    {
        $fp = fsockopen(
            $this->getParent()->getName(), 
            $this->_defaults['options']['port'], 
            $errno, 
            $errstr, 
            $this->_defaults['options']['timeout']
        );

        if (! $fp) {
            return false;
        } else {
            fwrite($fp, 'HELO');

            $banner = fgets($fp);

            fclose($fp);

            return false !== strpos($banner, '220 ' . $this->getParent()->getName());
        }
    }
}
