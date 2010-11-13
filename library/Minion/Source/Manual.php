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
 * A source to allow manual entry of domains in the configuration file.
 * 
 * Example:
 * 
 * <server>
 *     <sources>
 *         <manual>
 *             <hosts>
 *                 <example.com />
 *                 <example2.org />
 *             </hosts>
 *         </manual>
 *     </sources>
 * </server>
 */
class Minion_Source_Manual extends Minion_Source_Abstract
{
    /**
     * Loop through the hosts portion of the configuration to find domains for
     * this source.
     */
    protected function _getDomainsInternal()
    {
        if (! isset($this->getConfig()->hosts)
            || ! $this->getConfig()->hosts instanceof Zend_Config) {
    
            throw new Minion_Source_Exception(
                'Manual domain source must include at least one host.'
            );
        }

        foreach ($this->getConfig()->hosts as $host => $options) {
            $this->_addDomain($host, $options);
        }
    }
}
