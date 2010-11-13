<?php

class Minion_Task_Ping extends Minion_Task_Abstract_Server
{
    const ECHO_REQUEST = 8;

    const ECHO_CODE = 0;

    const ICMP_PORT = 0;

    const SOCKET_NO_FLAGS = 0;

    const SOCKET_BUFFER_LENGTH = 65535;

    protected $_defaults = array(
        'options' => array(
            'timeout' => 5
        )
    );

    private $_socket;

    public function main()
    {
        $this->_socket = $this->_openSocket();

        $this->_socketSend(
           $this->_createIcmpPacket(self::ECHO_REQUEST, self::ECHO_CODE) 
        );

        $startTime = microtime();
        
        $read   = array($this->_socket);
        $write  = null;
        $except = null;

        $select = socket_select(
            $read, 
            $write, 
            $except, 
            0,
            $this->getConfig()->options->timeout
        );

        if (null === $select) {

        } elseif (0 === $select) {

        }

        $recv     = '';
        $stopTime = microtime();

        $bufferLength = self::SOCKET_BUFFER_LENGTH;
        $flags        = self::SOCKET_NO_FLAGS;
        $port         = self::ICMP_PORT;


        socket_recvfrom(
            $socket, 
            $recv, 
            $bufferLength,
            $flags,
            $this->getParent()->getIp(), 
            $port
        );

        $this->_closeSocket();

        return $this->getResult()->setValue(Minion_Result::SUCCESS);
    }

    private function _createIcmpPacket($type, $code)
    {
        $packet = chr($type)              // Request type
                . chr($code)              // Code
                . chr($checksum[0])       // Checksum
                . chr($checksum[1])       // 
                . chr('M')                // Identifier
                . chr('I')                //
                . chr(mt_rand(0, 225))    // Sequence
                . chr(mt_rand(0, 225))    //
                . str_repeat(chr(0), 64); // Data

        $checksum = $this->_getChecksumData($packet);

        $packet[2] = $checksum[0];
        $packet[3] = $checksum[1];

        return $packet;
    }

    private function _checkReceived($recv)
    {
        $recv = unpack('C*', $recv);
       
        if (1 !== $recv[10]) {
            $this->_endWithError('Not an ICMP packet.');
        }

        if (0 !== $recv[21]) {
            $this->_endWithError('Not an ICMP response.');
        }

        if ($ident[0] !== $recv[25] || $ident[1] !== $recv[26]) {
            $this->_endWithError('Bad identification number.');
        }
       
        if ($seq[0] !== $recv[27] || $seq[1] !== $recv[28]) {
            $this->_endWithError('Bad sequence number.');
        }

        //$ms = ($time_stop - $time_start) * 1000;
       
        //if ($ms < 0) {
            //$g_icmp_error = "Response too long";
            //$ms = -1;
        //}
    }

    private function _getChecksumData($data)
    {
        $bit = unpack('n*', $data);
        $sum = array_sum($bit);

        if (strlen($data) % 2) {
            $temp = unpack('C*', $data[strlen($data) - 1]);
            $sum  += $temp[1];
        }

        $sum = ($sum >> 16) + ($sum & 0xffff);
        $sum += ($sum >> 16);

        return pack('n*', ~$sum);
    }
   
    private function _openSocket()
    {
        $socket = @socket_create(
            AF_INET, 
            SOCK_RAW,  
            getprotobyname('icmp')
        );
        
        if (! $socket) {
            $message = socket_strerror(
                socket_last_error()
            );

            throw new Minion_Task_Exception($message);
        }

        return $socket;
    }

    private function _socketSend($packet)
    {
        socket_sendto(
            $this->_socket, 
            $packet, 
            strlen($packet), 
            self::SOCKET_NO_FLAGS, 
            $this->getParent()->getIp(), 
            self::ICMP_PORT
        );
    }

    private function _closeSocket()
    {
        socket_close($this->_socket);
    }
    
    private function _endWithError($message)
    {
        $this->_closeSocket();
        throw new Minion_Task_Exception($message);
    }
}
