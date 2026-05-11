import { useState } from 'react'
import { Logo } from 'decentraland-ui2'
import type { WorldScene } from '../../../features/cast2/cast2.types'
import { useCastTranslation } from '../../../features/cast2/useCastTranslation'
import { JoinButton, LogoContainer, OnboardingContainer, OnboardingModal, Title } from '../WatcherOnboarding/WatcherOnboarding.styled'
import { WorldSceneSelectorProps } from './WorldSceneSelector.types'
import { SceneSelect, WorldName } from './WorldSceneSelector.styled'

function getSceneTitle(scene: WorldScene): string {
  return scene.entity?.metadata?.display?.title || 'Untitled Scene'
}

function getBaseParcel(scene: WorldScene): string {
  return scene.entity?.metadata?.scene?.base || scene.parcels[0] || '0,0'
}

export function WorldSceneSelector({ scenes, worldName, onSelect }: WorldSceneSelectorProps) {
  const { t } = useCastTranslation()
  const [selectedParcel, setSelectedParcel] = useState('')

  const handleConfirm = () => {
    if (selectedParcel) {
      onSelect(selectedParcel)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm()
    }
  }

  return (
    <OnboardingContainer>
      <OnboardingModal onKeyDown={handleKeyDown}>
        <LogoContainer>
          <Logo size="huge" />
        </LogoContainer>

        <Title>{t('scene_selector.title')}</Title>
        <WorldName>{worldName}</WorldName>

        <SceneSelect value={selectedParcel} onChange={e => setSelectedParcel(e.target.value)}>
          <option value="" disabled>
            {t('scene_selector.placeholder')}
          </option>
          {scenes.map(scene => {
            const baseParcel = getBaseParcel(scene)
            const title = getSceneTitle(scene)
            return (
              <option key={scene.entityId} value={baseParcel}>
                {title} ({baseParcel})
              </option>
            )
          })}
        </SceneSelect>

        <JoinButton onClick={handleConfirm} disabled={!selectedParcel}>
          {t('scene_selector.watch')}
        </JoinButton>
      </OnboardingModal>
    </OnboardingContainer>
  )
}
