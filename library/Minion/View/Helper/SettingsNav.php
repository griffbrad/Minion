<?php

class Minion_View_Helper_SettingsNav extends Zend_View_Helper_Abstract
{
    private $_active;

    public function settingsNav($active)
    {
        $this->_active = $active;

        return $this;
    }

    public function __toString()
    {
        $pages = array(
            'settings'               => 'General',
            'settings-users'         => 'Users',
            'settings-notifications' => 'Notifications',
            'settings-servers'       => 'Servers'
        );

        $out = '<ul id="minion-settings-navigation">';

        foreach ($pages as $page => $title) {
            $class = '';

            if ($this->_active === $page) {
                $class = 'selected'; 
            } 
            
            $out .= sprintf(
                '<li class="%s"><a href="%s.php">%s</a></li>',
                $class,
                $page,
                $title
            );
        }

        $out .= '</ul>';

        return $out;
    } 
}
