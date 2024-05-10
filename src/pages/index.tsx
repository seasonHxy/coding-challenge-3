import { StarIcon } from "@chakra-ui/icons";
import { Button, useToast } from "@chakra-ui/react";
import { useCallback, useState } from "react";
import { SiweMessage } from "siwe";
import ConnectWalletButton from "../components/ConnectWalletButton";

export default function Home() {
  const [wallet, setWallet] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const onClick = useCallback(() => {
    setLoading(true);
  }, []);

  const onSuccess = useCallback( async (message: SiweMessage, signature: string) => {
    setLoading(false);
    // TODO verify signature with message from backend
    const verifyFlag = await verifySign(message, signature);
    if(verifyFlag){
      toast({
        title: "Wallet Connection",
        description: "Verified",
        status: "success",
        duration: 9000,
        isClosable: true,
      });

      setWallet(message.address);
    }
    
  }, []);

  const onError = useCallback((errorMessage?: string) => {
    if (errorMessage) {
      toast({
        title: "Wallet Connection",
        description: errorMessage,
        status: "error",
        duration: 9000,
        isClosable: true,
      });
    }
    setLoading(false);
    setWallet("");
  }, []);

  const verifySign = async (message: SiweMessage, signature: string) =>{
    const response = await fetch("/api/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, signature }),
    });
    const responseBody = await response.json();

    if (!responseBody.success) {
      console.error("Failed to verify signature", responseBody.message);
      onError();
    } else if (responseBody.success) {
      return true;
    }
  }

  interface WalletButtonContentProps {
    wallet: string;
  }
  
  function WalletButtonContent({ wallet }: WalletButtonContentProps) {
    if (!wallet) {
      return (
        <Button isDisabled={loading} className="flex w-fit bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-4" as="div">
          Connect Wallet
        </Button>
      );
    }
  
    return (
      <Button className="flex w-fit bg-gradient-to-r from-sky-500 to-indigo-500 p-4" as="div">
        You have successfully connected your wallet: {wallet} 
      </Button>
    );
  }

  return (
    <div className="container m-auto p-8 flex flex-col gap-8 text-center">
      <h1 className="mt-16">Wallet: {wallet || "Not Connected"}</h1>

      <div className="flex justify-center">


        <ConnectWalletButton
          onClick={onClick}
          onSuccess={onSuccess}
          onError={onError}
        >
          <WalletButtonContent wallet={wallet} />

        </ConnectWalletButton>
      </div>
    </div>
  );
}


