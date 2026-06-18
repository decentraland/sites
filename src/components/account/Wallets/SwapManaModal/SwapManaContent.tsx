import { useCallback, useMemo, useState } from 'react'
import { encodeAbiParameters, parseEther } from 'viem'
import { useAccount, usePublicClient, useSwitchChain, useWriteContract } from 'wagmi'
import { useWallet } from '@dcl/core-web3'
import { Button, TextField } from 'decentraland-ui2'
import { useFormatMessage } from '../../../../hooks/adapters/useFormatMessage'
import {
  ERC20_ALLOWANCE_ABI,
  ROOT_CHAIN_MANAGER_ABI,
  getErc20PredicateAddress,
  getL1ChainId,
  getRootChainManagerAddress
} from '../bridgeContract'
import { getManaAddress } from '../manaContract'
import { Body, Centered, ConnectList, Description, StateText } from '../SendManaModal/SendManaModal.styled'

interface SwapManaContentProps {
  // MANA balance on Ethereum (L1) — the amount available to deposit to Polygon.
  balance: number | undefined
  onClose: () => void
  // Called after a confirmed deposit so the page can refresh balances (the L1 balance drops now;
  // Polygon credits after the bridge sync, which can take ~20-30 min).
  onSuccess?: () => void
}

type Phase = 'idle' | 'approving' | 'depositing' | 'success'

const SwapManaContent = ({ balance, onClose, onSuccess }: SwapManaContentProps) => {
  const t = useFormatMessage()
  const { isConnected, connect, connectors } = useWallet()
  const { address, chainId } = useAccount()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  const { writeContractAsync } = useWriteContract()
  const l1ChainId = getL1ChainId()
  const publicClient = usePublicClient({ chainId: l1ChainId })

  const [amount, setAmount] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [errorKey, setErrorKey] = useState<string | null>(null)

  const amountValue = Number(amount)
  const isAmountValid = amountValue > 0 && (balance === undefined || amountValue <= balance)
  const isBusy = phase === 'approving' || phase === 'depositing'

  // Deposit Ethereum→Polygon: approve the ERC20 predicate (only if the allowance is short), then
  // call RootChainManager.depositFor. Two sequential txs orchestrated imperatively so each waits
  // for its receipt before the next.
  const handleSwap = useCallback(async () => {
    if (!address || !publicClient || !isAmountValid) return
    setErrorKey(null)
    try {
      const amountWei = parseEther(amount)
      const manaAddress = getManaAddress('ethereum')
      const predicate = getErc20PredicateAddress()

      const allowance = await publicClient.readContract({
        address: manaAddress,
        abi: ERC20_ALLOWANCE_ABI,
        functionName: 'allowance',
        args: [address, predicate]
      })

      if (allowance < amountWei) {
        setPhase('approving')
        const approveHash = await writeContractAsync({
          address: manaAddress,
          abi: ERC20_ALLOWANCE_ABI,
          functionName: 'approve',
          args: [predicate, amountWei],
          chainId: l1ChainId
        })
        const approveReceipt = await publicClient.waitForTransactionReceipt({ hash: approveHash })
        if (approveReceipt.status !== 'success') throw new Error('Approval reverted')
      }

      setPhase('depositing')
      const depositData = encodeAbiParameters([{ type: 'uint256' }], [amountWei])
      const depositHash = await writeContractAsync({
        address: getRootChainManagerAddress(),
        abi: ROOT_CHAIN_MANAGER_ABI,
        functionName: 'depositFor',
        args: [address, manaAddress, depositData],
        chainId: l1ChainId
      })
      // waitForTransactionReceipt resolves even when the tx reverted — guard on the status so a
      // reverted deposit doesn't show "success".
      const depositReceipt = await publicClient.waitForTransactionReceipt({ hash: depositHash })
      if (depositReceipt.status !== 'success') throw new Error('Deposit reverted')

      setPhase('success')
      onSuccess?.()
    } catch (error) {
      // Rule 10: never surface the raw provider error — map to a stable message.
      const message = error instanceof Error ? error.message : ''
      setErrorKey(/rejected|denied|UserRejected/i.test(message) ? 'account.wallets.swap.rejected' : 'account.wallets.swap.error')
      setPhase('idle')
    }
  }, [address, publicClient, isAmountValid, amount, writeContractAsync, l1ChainId, onSuccess])

  const submitLabel = useMemo(() => {
    if (phase === 'approving') return t('account.wallets.swap.approving')
    if (phase === 'depositing') return t('account.wallets.swap.depositing')
    return t('account.wallets.swap.submit')
  }, [phase, t])

  if (phase === 'success') {
    return (
      <Centered data-role="swap-success">
        <StateText>{t('account.wallets.swap.success')}</StateText>
        <Button variant="contained" color="primary" fullWidth onClick={onClose}>
          {t('account.wallets.swap.close')}
        </Button>
      </Centered>
    )
  }

  if (!isConnected) {
    return (
      <Body data-role="swap-connect">
        <Description>{t('account.wallets.swap.connect_description')}</Description>
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

  if (chainId !== l1ChainId) {
    return (
      <Body data-role="swap-switch">
        <Description>{t('account.wallets.swap.switch_description')}</Description>
        <Button variant="contained" color="primary" fullWidth disabled={isSwitching} onClick={() => switchChain({ chainId: l1ChainId })}>
          {t('account.wallets.swap.switch_button')}
        </Button>
      </Body>
    )
  }

  return (
    <Body data-role="swap-form">
      <Description>{t('account.wallets.swap.description')}</Description>
      <TextField
        variant="outlined"
        type="number"
        label={t('account.wallets.swap.amount_label')}
        value={amount}
        onChange={event => setAmount(event.target.value)}
        disabled={isBusy}
        data-role="swap-amount"
      />
      {errorKey && <StateText $error>{t(errorKey)}</StateText>}
      <Button
        variant="contained"
        color="primary"
        fullWidth
        disabled={!isAmountValid || isBusy}
        onClick={handleSwap}
        data-role="swap-submit"
      >
        {submitLabel}
      </Button>
    </Body>
  )
}

export { SwapManaContent }
