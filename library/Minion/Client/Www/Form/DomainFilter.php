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

class Minion_Client_Www_Form_DomainFilter extends Zend_Form
{
    /**
     * Add needed form elements for filtering.  This form allows filtering on
     * server, task, and success/failure.
     */
    public function init()
    {
        $this->setAttrib('method', 'get')
             ->setAttrib('action', 'index.php');

        $task = new Zend_Form_Element_Select('task');
        $task->setLabel('Task');
        $task->options = array('View All') + $this->_getTaskOptions();
        $this->addElement($task);

        $failure = new Zend_Form_Element_Checkbox('failure');
        $failure->setLabel('Only Show Failures');
        $this->addElement($failure);

        $submit = new Zend_Form_Element_Submit('filter');
        $submit->setLabel('Filter');
        $this->addElement($submit);
    }
   
    /**
     * Retrieve options for the task filter from the database.
     *
     * @return array
     */
    protected function _getTaskOptions()
    {
        $table  = new Zend_Db_Table('tasks');
        $stmt   = $table->select();
        
        $stmt->from($table, array('value' => 'task', 'title' => 'task'))
             ->order('task');
                       
        return $table->getAdapter()->fetchPairs($stmt);
    }
}
