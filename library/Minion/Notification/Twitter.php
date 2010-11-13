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
 * Send notification messages via Twitter.
 *
 * Currently this only supports direct messages.  We may want to add support for
 * setting status as well.
 */
class Minion_Notification_Twitter extends Minion_Notification_Abstract
{
    /**
     * Send the provided message to all the account specified in the
     * configuration.
     *
     * The message's summary is used and additionally filtered to be no more
     * than 140 characters long to ensure it will be sent properly by Twitter.
     *
     * @param Minion_Message $message The message to send.
     */
    public function send(Minion_Message $message)
    {
        $twitter = new Zend_Service_Twitter(
            $this->getConfig()->username,
            $this->getConfig()->password
        );

        foreach ($this->getConfig()->directmessages as $account => $details) {
            if (
                ! $details instanceof Zend_Config 
                || Minion_Config::isEnabled($details)
            ) {
                $twitter->directMessage->new(
                    $account, 
                    $message->getSummary(140)
                );
            }
        }

        $twitter->account->endSession();
    }
}
