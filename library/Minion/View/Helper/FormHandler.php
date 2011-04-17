<?php

class Minion_View_Helper_FormHandler extends Zend_View_Helper_Abstract
{
    private $_form;
    
    public function formHandler($form = null)
    {
        if ($form) {
            $this->_form = $form;
        }

        return $this->_form;
    }
}
