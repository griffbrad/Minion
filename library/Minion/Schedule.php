<?php

class Minion_Schedule
{
    private $_text;

    private $_lastEvent;

    private $_interval;

    public function __construct($text, $taskStatus = null)
    {
        $lastEvent = null;

        if (isset($taskStatus['executionTime'])) {
            $lastEvent = $taskStatus['executionTime'];
        }
        
        $this->setText($text)
             ->setLastEvent($lastEvent);
    }

    public function setText($text)
    {
        $this->_text = $text;

        $this->_interval = null;

        return $this;
    }

    public function setLastEvent($lastEvent)
    {
        $this->_lastEvent = $lastEvent;

        return $this;
    }

    public function getInterval()
    {
        if (! $this->_interval) {
            $matches = array();

            if (preg_match('/(\d+)\s+?([A-Z])/i', $this->_text, $matches)) {
                $this->_interval = $matches[1] * $this->_multipleUnit($matches[2]);
            } else {
                throw new Minion_Exception(
                    "Could not parse schedule description '{$this->_text}'"
                );
            }
        }

        return $this->_interval;
    }

    public function shouldRun()
    {
        return (! $this->_lastEvent)
            || (time() > $this->_lastEvent + $this->getInterval());
    }

    private function _multiplyUnit($unit)
    {
        $unit  = strtoupper($unit);
        $units = array(
            'D' => 60 * 60 * 24,
            'H' => 60 * 60,
            'M' => 60
        );

        return $units[$unit];
    }
}
