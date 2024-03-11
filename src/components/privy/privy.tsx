"use client"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useAccount, useDisconnect, useWalletClient } from "wagmi"
import { usePublicClient } from "wagmi"
import { Loader } from "@/components/loader"
import {
    SmartAccount,
    signerToSimpleSmartAccount
} from "permissionless/accounts"
import { PrivyProvider, usePrivy, useWallets } from "@privy-io/react-auth"
import { Address, Chain, Hash, Transport, http } from "viem"
// import { CustomSigner } from "./customSigner"
import {
    SmartAccountClient,
    createSmartAccountClient,
    walletClientToCustomSigner
} from "permissionless"
import { createPimlicoPaymasterClient } from "permissionless/clients/pimlico"
import { DemoTransactionButton } from "@/components/demo-transaction"
import { PrivyWagmiConnector, usePrivyWagmi } from "@privy-io/wagmi-connector"
import { WagmiConfig, createConfig, configureChains, sepolia } from "wagmi"
import { jsonRpcProvider } from "@wagmi/core/providers/jsonRpc"
import { ethers } from 'ethers'

// import { BigInt, TransactionRequestEIP1559 } from '@viem/clients'
const configureChainsConfig = configureChains(
    [sepolia],
    [
        jsonRpcProvider({
            rpc: () => ({
                http: process.env.NEXT_PUBLIC_RPC_URL!
            })
        })
    ]
)







const config = createConfig({
    autoConnect: true,
    publicClient: configureChainsConfig.publicClient
})

if (!process.env.NEXT_PUBLIC_PRIVY_APP_ID)
    throw new Error("Missing NEXT_PUBLIC_PRIVY_APP_ID")

const pimlicoPaymaster = createPimlicoPaymasterClient({
    transport: http(process.env.NEXT_PUBLIC_PIMLICO_PAYMASTER_RPC_HOST!)
})

export const PrivyFLowProvider = ({
    children
}: { children: React.ReactNode }) => {


    return (
        <WagmiConfig config={config}>
            <PrivyProvider
                appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
                config={{
                    embeddedWallets: {
                        createOnLogin: "all-users"
                    },
                    loginMethods: ["email", "wallet"],
                    appearance: {
                        theme: "light",
                        accentColor: "#676FFF",
                        logo: "https://avatars.githubusercontent.com/u/125581500?s=200&v=4"
                    }
                }}
            >
                <PrivyWagmiConnector wagmiChainsConfig={configureChainsConfig}>
                    {children}
                </PrivyWagmiConnector>
            </PrivyProvider>
        </WagmiConfig>
    )
}

export const PrivyFlow = () => {
    const { login } = usePrivy()
    const { isConnected } = useAccount()
    const [showLoader, setShowLoader] = useState<boolean>(false)
    const [smartAccountClient, setSmartAccountClient] = useState<SmartAccountClient<Transport, Chain, SmartAccount> | null>(null);
  

    const [walletBalance, setWalletBalance] = useState("");
    const [embeddedWallets, setEmbeddedWallet] = useState<any>("");

    const publicClient = usePublicClient()
    const { wallets } = useWallets()
    const { data: walletClient } = useWalletClient()
    const [txHash, setTxHash] = useState<string | null>(null)
    const { disconnect } = useDisconnect()

    const { setActiveWallet } = usePrivyWagmi()

    const embeddedWallet = useMemo(
        () => wallets.find((wallet) => wallet.walletClientType === "privy"),
        [wallets]
    )

    useEffect(() => setActiveWallet(embeddedWallet), [embeddedWallet])



    const { user, ready,
        linkWallet,
        linkEmail,
        linkGithub,
        linkGoogle,
        linkPhone,
        linkDiscord,
        linkTwitter,
        logout, authenticated, signMessage, sendTransaction } = usePrivy();



    useEffect(() => {
        if (!ready) {
            return;
        }
        setUpEmbeddedWallet();
    }, [wallets, ready]);

    const setUpEmbeddedWallet = async () => {
        const embeddedWallet = wallets.find(
            (wallet) => wallet.walletClientType === "privy"
        );

        if (embeddedWallet) {
            setActiveWallet(embeddedWallet);
            const provider = await embeddedWallet.getEthereumProvider();
            await provider.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: `0x${Number(11155111).toString(16)}` }],
            });
            
            const ethProvider = new ethers.BrowserProvider(provider);
            const walletBalance = await ethProvider.getBalance(embeddedWallet.address);
            const ethStringAmount = ethers.formatEther(walletBalance);
            setWalletBalance(ethStringAmount);
            setEmbeddedWallet(embeddedWallet);
        }
    };



    const signIn = useCallback(async () => {
        setShowLoader(true)
        login()
    }, [login])

    const signOut = useCallback(async () => {
        setShowLoader(false)
        disconnect()
    }, [disconnect])

    useEffect(() => {
        (async () => {
            if (isConnected && walletClient && publicClient) {

                const customSigner = walletClientToCustomSigner(walletClient)

                const safeSmartAccountClient = await signerToSimpleSmartAccount(
                    publicClient,
                    {
                        entryPoint: process.env
                            .NEXT_PUBLIC_ENTRYPOINT! as Address,
                        signer: customSigner,
                        factoryAddress: process.env
                            .NEXT_PUBLIC_FACTORY_ADDRESS! as Address
                    }
                )

                const smartAccountClient = createSmartAccountClient({
                    account: safeSmartAccountClient,
                    chain: sepolia,
                    transport: http(process.env.NEXT_PUBLIC_BUNDLER_RPC_HOST!),
                    sponsorUserOperation: pimlicoPaymaster.sponsorUserOperation
                  }) as SmartAccountClient<Transport, Chain, SmartAccount>;
                  
                  setSmartAccountClient(smartAccountClient);
            } 
        })()
    }, [isConnected, walletClient, publicClient])

    const onSendTransaction = (txHash: Hash) => {
        setTxHash(txHash)
    }

    const onSendMessage = (txHash: Hash) => {
        setTxHash(txHash)
    }


    if (!user) return <></>;


    if (isConnected && smartAccountClient && embeddedWallet) {
        return (
            <div>
                <div>

                    <h2 className="text-white">     <li>Wallet: {user.wallet ? user.wallet.address : "None"}</li></h2>
                    <div className="text-white">
                        <h1>Privy User ID : {user.id}</h1>
                    </div>

                    Smart contract wallet address:{" "}

                    <p className="fixed left-0 top-0 flex flex-col w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
                        <code>{smartAccountClient.account?.address}</code>
                    </p>
                </div>
                <div className="flex gap-x-4 flex-col">
                    <button
                        onClick={signOut}
                        className="mt-6 flex justify-center items-center w-64 cursor-pointer border-2 border-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                        Sign out
                    </button>
                    <DemoTransactionButton
                    smartAccountClient={smartAccountClient}
                    onSendTransaction={onSendTransaction}
                />
                    {/* <DemoTransactionMsgButton
                    smartAccountClient={smartAccountClient}
                    onSendMessage={onSendMessage}
                /> */}
                </div>
                {txHash && (
                    <p className="mt-4">
                        Transaction hash:{" "}
                        <a
                            href={`https://sepolia.etherscan.io/tx/${txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                        >
                            {txHash}
                        </a>
                    </p>
                )}
                <h3 className="font-extrabold mb-2 mx-10 text-white">
                    Embedded Wallet <br /> Address:
                </h3>
                <div className="flex flex-col">
                    <p>{embeddedWallet?.address}</p>

                    {walletBalance && (
                        <p className="mt-2 text-white">With a balance of {walletBalance} ETH</p>
                    )}
                </div>

            </div>
        )
    }

    return (
        <button
            onClick={signIn}
            className="flex justify-center items-center w-64 cursor-pointer bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
            {!showLoader && <p className="mr-4">Sign in with Privy</p>}
            {showLoader && <Loader />}
        </button>
    )
}
