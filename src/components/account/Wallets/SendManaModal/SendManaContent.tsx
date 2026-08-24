import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { parseEther } from 'viem'
import { useAccount, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { useWallet } from '@dcl/core-web3'
import { Button, TextField } from 'decentraland-ui2'
import { useFormatMessage } from '../../../../hooks/adapters/useFormatMessage'
import { useWalletTransactions } from '../../../../hooks/useWalletTransactions'
import { ERC20_TRANSFER_ABI, type WalletNetwork, getManaAddress, getNetworkChainId } from '../manaContract'
import { Body, Centered, ConnectList, Description, StateText } from './SendManaModal.styled'

interface SendManaContentProps {
  network: WalletNetwork
  // Session address used to key the local transaction log (same key the cards read).
  address: string | undefined
  // MANA balance on this network — gates the amount so a transfer can't exceed it.
  balance?: number
  onClose: () => void
  onSuccess?: () => void
}

const ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/

const SendManaContent = ({ network, address, balance, onClose, onSuccess }: SendManaContentProps) => {
  const t = useFormatMessage()
  const { isConnected, connect, connectors } = useWallet()
  const { chainId } = useAccount()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  const { writeContract, data: hash, isPending: isSending, error: writeError } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })
  const { addTransaction, updateTransactionStatus } = useWalletTransactions(address)

  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('')
  const recordedHash = useRef<string | null>(null)
  const confirmedHash = useRef<string | null>(null)

  // Record the transfer the moment it has a hash (pending), then flip to confirmed when mined.
  useEffect(() => {
    if (hash && recordedHash.current !== hash) {
      recordedHash.current = hash
      addTransaction({ hash, type: 'send', network, amount: Number(amount), timestamp: Date.now(), status: 'pending' })
    }
  }, [hash, network, amount, addTransaction])

  // Keyed on the hash, like the record above: `onSuccess` is an inline callback in the
  // parent, so its identity changes on every render and the effect re-runs on each one.
  // Without the guard that re-ran the write and called `onSuccess` again per render
  // (SITES-2RX).
  useEffect(() => {
    if (!isSuccess || !hash || confirmedHash.current === hash) return
    confirmedHash.current = hash
    updateTransactionStatus(hash, 'confirmed')
    onSuccess?.()
  }, [isSuccess, hash, updateTransactionStatus, onSuccess])

  const targetChainId = getNetworkChainId(network)
  const isAddressValid = ADDRESS_REGEX.test(to.trim())
  const amountValue = Number(amount)
  // Gate the amount on the available balance, matching SwapManaContent (the tx would otherwise revert
  // on-chain, wasting gas). When the balance is unknown (undefined) we only require a positive amount.
  const isAmountValid = amountValue > 0 && (balance === undefined || amountValue <= balance)
  const isOverBalance = balance !== undefined && amountValue > balance
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
        error={amount.length > 0 && isOverBalance}
        helperText={amount.length > 0 && isOverBalance ? t('account.wallets.send.insufficient_balance') : undefined}
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
