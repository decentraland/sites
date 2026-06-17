import { useCallback, useMemo, useState } from 'react'
import { parseEther } from 'viem'
import { useAccount, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { useWallet } from '@dcl/core-web3'
import { Button, TextField } from 'decentraland-ui2'
import { useFormatMessage } from '../../../../hooks/adapters/useFormatMessage'
import { ERC20_TRANSFER_ABI, type WalletNetwork, getManaAddress, getNetworkChainId } from '../manaContract'
import { Body, Centered, ConnectList, Description, StateText } from './SendManaModal.styled'

interface SendManaContentProps {
  network: WalletNetwork
  onClose: () => void
}

const ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/

const SendManaContent = ({ network, onClose }: SendManaContentProps) => {
  const t = useFormatMessage()
  const { isConnected, connect, connectors } = useWallet()
  const { chainId } = useAccount()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  const { writeContract, data: hash, isPending: isSending, error: writeError } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('')

  const targetChainId = getNetworkChainId(network)
  const isAddressValid = ADDRESS_REGEX.test(to.trim())
  const isAmountValid = Number(amount) > 0
  const isBusy = isSending || isConfirming

  const handleSend = useCallback(() => {
    if (!isAddressValid || !isAmountValid) return
    writeContract({
      address: getManaAddress(network),
      abi: ERC20_TRANSFER_ABI,
      functionName: 'transfer',
      args: [to.trim() as `0x${string}`, parseEther(amount)],
      chainId: targetChainId
    })
  }, [isAddressValid, isAmountValid, writeContract, network, to, amount, targetChainId])

  // Rule 10: never surface the raw provider error — map to a stable message (rejection vs generic).
  const errorMessage = useMemo(() => {
    if (!writeError) return null
    const isRejected = /rejected|denied|UserRejected/i.test(writeError.message)
    return isRejected ? t('account.wallets.send.rejected') : t('account.wallets.send.error')
  }, [writeError, t])

  if (isSuccess) {
    return (
      <Centered data-role="send-success">
        <StateText>{t('account.wallets.send.success')}</StateText>
        <Button variant="contained" color="primary" fullWidth onClick={onClose}>
          {t('account.wallets.send.close')}
        </Button>
      </Centered>
    )
  }

  if (!isConnected) {
    return (
      <Body data-role="send-connect">
        <Description>{t('account.wallets.send.connect_description')}</Description>
        <ConnectList>
          {connectors.map(connector => (
            <Button key={connector.uid} variant="outlined" color="primary" fullWidth onClick={() => connect(connector)}>
              {connector.name}
            </Button>
          ))}
        </ConnectList>
      </Body>
    )
  }

  if (chainId !== targetChainId) {
    return (
      <Body data-role="send-switch">
        <Description>{t('account.wallets.send.switch_description')}</Description>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          disabled={isSwitching}
          onClick={() => switchChain({ chainId: targetChainId })}
        >
          {t('account.wallets.send.switch_button')}
        </Button>
      </Body>
    )
  }

  return (
    <Body data-role="send-form">
      <TextField
        variant="outlined"
        label={t('account.wallets.send.to_label')}
        placeholder="0x…"
        value={to}
        onChange={event => setTo(event.target.value)}
        error={to.length > 0 && !isAddressValid}
        helperText={to.length > 0 && !isAddressValid ? t('account.wallets.send.invalid_address') : undefined}
        disabled={isBusy}
        data-role="send-to"
      />
      <TextField
        variant="outlined"
        type="number"
        label={t('account.wallets.send.amount_label')}
        value={amount}
        onChange={event => setAmount(event.target.value)}
        disabled={isBusy}
        data-role="send-amount"
      />
      {errorMessage && <StateText $error>{errorMessage}</StateText>}
      <Button
        variant="contained"
        color="primary"
        fullWidth
        disabled={!isAddressValid || !isAmountValid || isBusy}
        onClick={handleSend}
        data-role="send-submit"
      >
        {isSending
          ? t('account.wallets.send.confirm_in_wallet')
          : isConfirming
            ? t('account.wallets.send.sending')
            : t('account.wallets.send.send_button')}
      </Button>
    </Body>
  )
}

export { SendManaContent }
