import { Button } from "@chakra-ui/react";
import { ConnectButton, useConnectModal } from "@rainbow-me/rainbowkit";
import { ReactNode, useEffect, useState } from "react";
import { SiweMessage } from "siwe";
import { useAccount, useDisconnect, useSignMessage } from "wagmi";
import Dialog from "@/components/Dialog";
import { signingMessage } from "@/services/auth";

const ConnectWalletButton = ({
  className: className = "",
  children,
  disabled,
  onClick: onClick = () => {},
  onSuccess: onSuccess = () => {},
  onError: onError = () => {},
}: {
  name?: string;
  disabled?: boolean;
  children?: ReactNode;
  className?: string;
  onClick?: () => void;
  onSuccess?: (message: SiweMessage, signature: string) => void;
  onError?: () => void;
}) => {
  const { address, isConnected, isConnecting } = useAccount();
  const { connectModalOpen } = useConnectModal();
  const { disconnect } = useDisconnect();
  const [walletDialog, setWalletDialog] = useState<JSX.Element | null>(null);
  const [message, setMessage] = useState<SiweMessage | null>(null);
  const [nonce, setNonce] = useState("");
  const [showConfirmAddress, setShowConfirmAddress] = useState(false);
  const [active, setActive] = useState(false);

  const {
    data: signature,
    isSuccess: isSigned,
    error: signError,
    signMessage,
  } = useSignMessage();

  useEffect(() => {
    if (signError) {
      onError();
    }
  }, [signError]);

  useEffect(() => {
    setActive(connectModalOpen);
  }, [connectModalOpen]);

  useEffect(() => {
    if (isSigned && signature && message) {
      onSuccess(message, signature);
    }
  }, [isSigned, signature, message]);

  useEffect(() => {
    disconnect();
  }, []);

  const reset = () => {
    setShowConfirmAddress(false);
    setWalletDialog(null);
    setMessage(null);
    setNonce("");
  };

  const cancel = () => {
    reset();
    disconnect();
    onError();
  };

  async function onConfirmWallet() {
    setShowConfirmAddress(false);
    await handleSignMessage(address);
  }

  const handleSignMessage = async (
    address?: string
  ): Promise<SiweMessage | null> => {
    if (!address) return null;
    const nonce = await fetchNonce();
    const message = await signingMessage(address, nonce);
    setNonce(nonce);
    setMessage(message);
    await signMessage({ message: message.prepareMessage() });
    return message;
  };

  const fetchNonce = async () => {
    const res = await fetch("/api/nonce");
    const data = await res.json();
    return data.nonce;
  };

  const handleOpenConnectModal = (
    connected: boolean,
    openConnectModal: () => void
  ) => {
    if (!connected) {
      onClick();
      openConnectModal();
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      setShowConfirmAddress(true);
    }
  }, [isConnected, address]);

  return (
    <>
      <ConnectButton.Custom>
        {({ account, chain, openConnectModal, mounted }) => {
          const ready = mounted;
          const connected = !!(ready && account && chain);
          return (
            <>
              <Button
                variant="ghost"
                className={"min-w-fit " + className}
                onClick={() => {
                  handleOpenConnectModal(
                    connected || isConnected,
                    openConnectModal
                  );
                }}
                isDisabled={disabled}
                isLoading={active && (isConnecting || !ready)}
                padding={0}
              >
                {children}
              </Button>
            </>
          );
        }}
      </ConnectButton.Custom>
      <Dialog
        isCentered
        size="md"
        title="CONFIRM WALLET"
        isOpen={showConfirmAddress}
        onClose={() => setShowConfirmAddress(false)}
       
      >
        <div className="flex justify-center text-black">
        <div className="mt-16 w-1/3 bg-white p-8 flex flex-col gap-6 font-bold text-center">
          <div className="text-xl uppercase">
            You are connecting the following address:
          </div>
          <div className="bg-slate-200 py-1">
            {address}
          </div>
          <div className="flex flex-row justify-between text-white">
            <Button className="p-2 bg-blue-400 rounded-lg" onClick={cancel}>Cancel</Button>
            <Button  className="p-2 bg-blue-500 rounded-lg" onClick={onConfirmWallet} disabled={!address}>
              Confirm
            </Button>
          </div>
        </div>
        </div>
      </Dialog>
    </>
  );
};

export default ConnectWalletButton;
