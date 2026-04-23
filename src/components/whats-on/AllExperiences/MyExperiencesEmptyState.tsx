import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
// eslint-disable-next-line @typescript-eslint/naming-convention
import AddIcon from '@mui/icons-material/Add'
import { useTranslation } from '@dcl/hooks'
import { EmptyButton, EmptyPanel, EmptyTitle } from './MyExperiencesEmptyState.styled'

function MyExperiencesEmptyState() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const handleCreate = useCallback(() => {
    navigate('/whats-on/new-event')
  }, [navigate])

  return (
    <EmptyPanel role="status">
      <EmptyTitle>{t('my_experiences.empty_title')}</EmptyTitle>
      <EmptyButton variant="outlined" startIcon={<AddIcon />} onClick={handleCreate}>
        {t('my_experiences.empty_cta')}
      </EmptyButton>
    </EmptyPanel>
  )
}

export { MyExperiencesEmptyState }
