<?php

class Minion_View_Helper_FormField extends Zend_View_Helper_Abstract
{
    private $_label;

    private $_for;

    private $_note;

    private $_help;

    private $_warn;

    public function reset()
    {
        $this->_label = '';
        $this->_for   = '';
        $this->_note  = '';
        $this->_help  = '';
        $this->_warn  = '';
    }

    public function formField(array $options = array())
    {
        foreach ($options as $key => $value) {
            $method = 'set' . ucfirst($key);

            if (method_exists($this, $method)) {
                $this->$method($value);
            }
        }

        return $this;
    }

    public function setWarn($warn)
    {
        $this->_warn = $warn;

        return $this;
    }

    public function setHelp($help)
    {
        $this->_help = $help;

        return $this;
    }

    public function setFor($for)
    {
        $this->_for = $for;

        return $this;
    }

    public function setLabel($label)
    {
        $this->_label = $label;

        return $this;
    }

    public function setNote($note)
    {
        $this->_note = $note;

        return $this;
    }

    public function open()
    {
        if (count($this->view->formHandler()->getMessages($this->_for))) {
            echo '<div class="minion-form-field minion-form-field-with-messages">';
        } else {
            echo '<div class="minion-form-field">';
        }

        echo '<label for="' . $this->view->escape($this->_for) . '">';
        echo $this->view->escape($this->_label);
        echo '</label>';

        if ($this->_warn) {
            echo '<span class="minion-warning">';
            echo $this->view->escape($this->_warn['label']);
            echo '</span>';
        }

        if ($this->_help) {
            echo '<a id="';
            echo $this->view->escape($this->_help);
            echo '" href="#" class="minion-help-link">Help</a>';
        }

        if ($this->_note) {
            echo '<div class="minion-form-field-note">';
            echo $this->view->escape($this->_note);
            echo '</div>';
        }

        echo '<div class="minion-form-field-contents">';
    }

    public function close($reset = true)
    {
        echo '</div>';

        $messages = $this->view->formHandler()->getMessages($this->_for);

        if (count($messages)) { 
            echo '<ul class="minion-form-field-errors">';
            
            foreach ($messages as $message) {
                echo '<li>';
                echo $this->view->escape($message);
                echo '</li>';
            }    
            
            echo '</ul>';
        }

        echo '</div>';

        if ($reset) {
            $this->reset();
        }
    }
}
