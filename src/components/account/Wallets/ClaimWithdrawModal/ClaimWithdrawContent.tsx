import { useCallback, useState } from 'react'
import { useAccount, usePublicClient, useSwitchChain, useWriteContract } from 'wagmi'
import { useWallet } from '@dcl/core-web3'
import { Button } from 'decentraland-ui2'
import { useFormatMessage } from '../../../../hooks/adapters/useFormatMessage'
import { useWalletTransactions } from '../../../../hooks/useWalletTransactions'
import type { WalletTransaction } from '../../../../hooks/useWalletTransactions.types'
import { ROOT_CHAIN_MANAGER_ABI, getL1ChainId, getRootChainManagerAddress } from '../bridgeContract'
import { fetchExitPayload } from '../bridgeProof'
import { Body, Centered, ConnectList, Description, StateText } from '../SendManaModal/SendManaModal.styled'
import { formatMana } from '../wallets.helpers'

interface ClaimWithdrawContentProps {
  // The in-flight withdrawal to claim. `hash` is the L2 burn tx, used to build the exit proof.
  withdrawal: WalletTransaction
  // Session address used to key the local transaction log (same key the cards read).
  address: string | undefined
  onClose: () => void
  // Called once the exit is confirmed so the page can refresh the now-credited Ethereum balance.
  onSuccess?: () => void
}

type Phase = 'idle' | 'claiming' | 'success'

const ClaimWithdrawContent = ({ withdrawal, address: trackingAddress, onClose, onSuccess }: ClaimWithdrawContentProps) => {
  const t = useFormatMessage()
  const { isConnected, connect, connectors } = useWallet()
  const { address, chainId } = useAccount()
  const { updateTransaction } = useWalletTransactions(trackingAddress)
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  const { writeContractAsync } = useWriteContract()
  const l1ChainId = getL1ChainId()
  const publicClient = usePublicClient({ chainId: l1ChainId })

  const [phase, setPhase] = useState<Phase>('idle')
  const [errorKey, setErrorKey] = useState<string | null>(null)

  const isBusy = phase === 'claiming'

  // Claim (exit) on Ethereum: fetch the RLP exit payload for the checkpointed burn, then call
  // RootChainManager.exit. The row goes checkpoint→pending while the L1 tx mines and →confirmed once
  // it settles (the subgraph will index the released MANA shortly after). On revert it returns to
  // checkpoint so the user can retry.
  const handleClaim = useCallback(async () => {
    if (!address || !publicClient) return
    setErrorKey(null)
    try {
      setPhase('claiming')
      const payload = await fetchExitPayload(withdrawal.hash)
      if (!payload) {
        // Not checkpointed yet — send the row back to "bridging" so the poller resumes and the claim
        // button hides until the exit is actually generatable. Retrying now wouldn't help.
        updateTransaction(withdrawal.hash, { status: 'bridging' })
        setErrorKey('account.wallets.claim.not_ready')
        setPhase('idle')
        return
      }
      const exitHash = await writeContractAsync({
        address: getRootChainManagerAddress(),
        abi: ROOT_CHAIN_MANAGER_ABI,
        functionName: 'exit',
        args: [payload],
        chainId: l1ChainId
      })
      updateTransaction(withdrawal.hash, { status: 'pending', claimHash: exitHash })
      const receipt = await publicClient.waitForTransactionReceipt({ hash: exitHash })
      if (receipt.status !== 'success') {
        updateTransaction(withdrawal.hash, { status: 'checkpoint' })
        throw new Error('Exit reverted')
      }
      updateTransaction(withdrawal.hash, { status: 'confirmed' })
      setPhase('success')
      onSuccess?.()
    } catch (error) {
      // Rule 10: never surface the raw provider error — map to a stable message.
      const message = error instanceof Error ? error.message : ''
      setErrorKey(/rejected|denied|UserRejected/i.test(message) ? 'account.wallets.claim.rejected' : 'account.wallets.claim.error')
      setPhase('idle')
    }
  }, [address, publicClient, withdrawal.hash, writeContractAsync, l1ChainId, updateTransaction, onSuccess])

  if (phase === 'success') {
    return (
      <Centered data-role="claim-success">
        <StateText>{t('account.wallets.claim.success')}</StateText>
        <Button variant="contained" color="primary" fullWidth onClick={onClose}>
          {t('account.wallets.claim.close')}
        </Button>
      </Centered>
    )
  }

  if (!isConnected) {
    return (
      <Body data-role="claim-connect">
        <Description>{t('account.wallets.claim.connect_description')}</Description>
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
      <Body data-role="claim-switch">
        <Description>{t('account.wallets.claim.switch_description')}</Description>
        <Button variant="contained" color="primary" fullWidth disabled={isSwitching} onClick={() => switchChain({ chainId: l1ChainId })}>
          {t('account.wallets.claim.switch_button')}
        </Button>
      </Body>
    )
  }

  return (
    <Body data-role="claim-form">
      <Description>{t('account.wallets.claim.description', { amount: formatMana(withdrawal.amount) })}</Description>
      {errorKey && <StateText $error>{t(errorKey)}</StateText>}
      <Button variant="contained" color="primary" fullWidth disabled={isBusy} onClick={handleClaim} data-role="claim-submit">
        {isBusy ? t('account.wallets.claim.claiming') : t('account.wallets.claim.submit')}
      </Button>
    </Body>
  )
}

export { ClaimWithdrawContent }
