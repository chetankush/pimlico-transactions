// YourCustomTransactionButtonComponent.jsx

import React from 'react';
import {ethers} from 'ethers'

const CustomTransactionButtonComponent = ({ smartAccountClient, onSendTransaction }) => {
    const handleClick = async () => {
        // Replace with your transaction details
        const transactionDetails = {
            to: '0xRecipientAddress',
            data: '0x',
            value: ethers.formatEther('0.1'),
        };

        onSendTransaction(transactionDetails);
    };

    return (
        <button
            onClick={handleClick}
            className="mt-6 flex justify-center items-center w-64 cursor-pointer bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
            Send Transaction
        </button>
    );
};

export default CustomTransactionButtonComponent;
