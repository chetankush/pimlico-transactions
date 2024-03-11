import { Loader } from "@/components/loader";
import { SmartAccountClient } from "permissionless";
import { SmartAccount } from "permissionless/accounts";
import { useState } from "react";
import { Chain, Hash, Transport } from "viem";
import { parseUnits } from "ethers/utils";
import { ethers } from "ethers";
import { usePrivy } from '@privy-io/react-auth'; // Import usePrivy hook

export const DemoTransactionButton = ({
  smartAccountClient,
  onSendTransaction,
}: {
  smartAccountClient: SmartAccountClient<Transport, Chain, SmartAccount>;
  onSendTransaction: (txHash: Hash) => void;
}) => {
  const { sendTransaction: sendPrivyTransaction } = usePrivy(); // Get sendTransaction from Privy
  const [loading, setLoading] = useState<boolean>(false);
  const [recipientAddress, setRecipientAddress] = useState<string>("");
  const [amount, setAmount] = useState<string>("");

  const sendTransaction = async () => {
    try {
      setLoading(true);
  
      // Validate recipient address and amount
      if (!recipientAddress || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        throw new Error("Invalid recipient address or amount");
      }
  
      // Convert amount to BigInt (assuming it's in SEPOLIA)
      const valueInWei = parseUnits(amount, "ether");
  
      // Trigger the wallet transaction popup from Privy
      const txReceipt = await sendPrivyTransaction({
        to: `0x${recipientAddress}`,
        data: "0x", // Assuming no additional transaction data
        value: valueInWei,
      });
  
      // Extract the transaction hash from the receipt
      const txHash = txReceipt.transactionHash;
  
      onSendTransaction(`${txHash}`);
    } catch (error) {
      console.error("Error sending transaction:", error);
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div>
      <div className="mb-4">
        <label className="text-gray-600">Recipient Address:</label>
        <input
          type="text"
          value={recipientAddress}
          onChange={(e) => setRecipientAddress(e.target.value)}
          className="border p-2 w-full text-black"
        />
      </div>

      <div className="mb-4">
        <label className="text-gray-600">Amount (SEPOLIA):</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="border p-2 w-full text-black"
        />
      </div>

      <button
        onClick={sendTransaction}
        className="flex justify-center items-center w-64 cursor-pointer bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        {!loading && <p className="mr-4">Send SEPOLIA</p>}
        {loading && <Loader />}
      </button>
    </div>
  );
};




import { zeroAddress } from "viem"

export const DemoTransactionMsgButton = ({
    smartAccountClient,
    onSendMessage
}: {
    smartAccountClient: SmartAccountClient<Transport, Chain, SmartAccount>
    onSendMessage: (txHash: Hash) => void
}) => {
    const [loading, setLoading] = useState<boolean>(false)

    const sendTransaction = async () => {
        setLoading(true)
        const txHash = await smartAccountClient.sendTransaction({
            to: zeroAddress,
            data: "0x",
            value: BigInt(0)
        })
        onSendMessage(txHash)
        setLoading(false)
    }

    return (
        <div>
            <button
                onClick={sendTransaction}
                className="mt-6 flex justify-center items-center w-64 cursor-pointer bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
                {!loading && <p className="mr-4">Demo transaction</p>}
                {loading && <Loader />}
            </button>
        </div>
    )
}
