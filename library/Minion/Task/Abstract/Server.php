<?php

abstract class Minion_Task_Abstract_Server extends Minion_Task_Abstract
{
    protected function _getRecentResults($offset, $limit = 100)
    {
        return array();
    }
}
