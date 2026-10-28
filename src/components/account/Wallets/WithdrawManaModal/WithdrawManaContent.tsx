import { useCallback, useMemo, useState } from 'react'
import { parseEther } from 'viem'
import { useAccount, usePublicClient, useSwitchChain, useWriteContract } from 'wagmi'
import { useWallet } from '@dcl/core-web3'
import { Button, TextField } from 'decentraland-ui2'
import { useFormatMessage } from '../../../../hooks/adapters/useFormatMessage'
import { useWalletTransactions } from '../../../../hooks/useWalletTransactions'
import { MANA_CHILD_WITHDRAW_ABI } from '../bridgeContract'
import { getManaAddress, getNetworkChainId } from '../manaContract'
import { Body, Centered, ConnectList, Description, StateText } from '../SendManaModal/SendManaModal.styled'

interface WithdrawManaContentProps {
  // MANA balance on Polygon (L2) — the amount available to withdraw to Ethereum.
  balance: number | undefined
  // Session address used to key the local transaction log (same key the cards read).
  address: string | undefined
  onClose: () => void
  // Called once the burn is mined so the page can refresh balances (the Polygon balance drops now;
  // the MANA lands on Ethereum only after the checkpoint + the user's exit claim).
  onSuccess?: () => void
}

type Phase = 'idle' | 'withdrawing' | 'success'

const WithdrawManaContent = ({ balance, address: trackingAddress, onClose, onSuccess }: WithdrawManaContentProps) => {
  const t = useFormatMessage()
  const { isConnected, connect, connectors } = useWallet()
  const { address, chainId } = useAccount()
  const { addTransaction } = useWalletTransactions(trackingAddress)
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  const { writeContractAsync } = useWriteContract()
  const l2ChainId = getNetworkChainId('polygon')
  const publicClient = usePublicClient({ chainId: l2ChainId })

  const [amount, setAmount] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [errorKey, setErrorKey] = useState<string | null>(null)

  const amountValue = Number(amount)
  const isAmountValid = amountValue > 0 && (balance === undefined || amountValue <= balance)
  const isBusy = phase === 'withdrawing'

  // Withdraw Polygon→Ethereum: burn MANA on L2 via the child token's `withdraw`. The exit (claim on
  // L1) happens later, once the burn is checkpointed — recorded here as a `bridging` row keyed by the
  // burn tx hash so the page can poll the proof API and offer the claim.
  const handleWithdraw = useCallback(async () => {
    if (!address || !publicClient || !isAmountValid) return
    setErrorKey(null)
    try {
      const amountWei = parseEther(amount)
      setPhase('withdrawing')
      const burnHash = await writeContractAsync({
        address: getManaAddress('polygon'),
        abi: MANA_CHILD_WITHDRAW_ABI,
        functionName: 'withdraw',
        args: [amountWei],
        chainId: l2ChainId
      })
      // waitForTransactionReceipt resolves even when the tx reverted — guard on status before tracking.
      const receipt = await publicClient.waitForTransactionReceipt({ hash: burnHash })
      if (receipt.status !== 'success') throw new Error('Withdraw reverted')
      addTransaction({
        hash: burnHash,
        type: 'withdraw',
        network: 'polygon',
        amount: amountValue,
        timestamp: Date.now(),
        status: 'bridging'
      })
      setPhase('success')
      onSuccess?.()
    } catch (error) {
      // Rule 10: never surface the raw provider error — map to a stable message.
      const message = error instanceof Error ? error.message : ''
      setErrorKey(/rejected|denied|UserRejected/i.test(message) ? 'account.wallets.withdraw.rejected' : 'account.wallets.withdraw.error')
      setPhase('idle')
    }
  }, [address, publicClient, isAmountValid, amount, writeContractAsync, l2ChainId, amountValue, addTransaction, onSuccess])

  const submitLabel = useMemo(
    () => (phase === 'withdrawing' ? t('account.wallets.withdraw.withdrawing') : t('account.wallets.withdraw.submit')),
    [phase, t]
  )

  if (phase === 'success') {
    return (
      <Centered data-role="withdraw-success">
        <StateText>{t('account.wallets.withdraw.success')}</StateText>
        <Button variant="contained" color="primary" fullWidth onClick={onClose}>
          {t('account.wallets.withdraw.close')}
        </Button>
      </Centered>
    )
  }

  if (!isConnected) {
    return (
      <Body data-role="withdraw-connect">
        <Description>{t('account.wallets.withdraw.connect_description')}</Description>
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

  if (chainId !== l2ChainId) {
    return (
      <Body data-role="withdraw-switch">
        <Description>{t('account.wallets.withdraw.switch_description')}</Description>
        <Button variant="contained" color="primary" fullWidth disabled={isSwitching} onClick={() => switchChain({ chainId: l2ChainId })}>
          {t('account.wallets.withdraw.switch_button')}
        </Button>
      </Body>
    )
  }

  return (
    <Body data-role="withdraw-form">
      <Description>{t('account.wallets.withdraw.description')}</Description>
      <TextField
        variant="outlined"
        type="number"
        label={t('account.wallets.withdraw.amount_label')}
        value={amount}
        onChange={event => setAmount(event.target.value)}
        disabled={isBusy}
        data-role="withdraw-amount"
      />
      {errorKey && <StateText $error>{t(errorKey)}</StateText>}
      <Button
        variant="contained"
        color="primary"
        fullWidth
        disabled={!isAmountValid || isBusy}
        onClick={handleWithdraw}
        data-role="withdraw-submit"
      >
        {submitLabel}
      </Button>
    </Body>
  )
}

export { WithdrawManaContent }
