jest.mock('decentraland-ui2', () => {
  const actual = jest.requireActual('../../../../__test-utils__/styledMock')
  return { ...actual, Typography: actual.Box, Button: actual.Box, Checkbox: actual.Box, FormControlLabel: actual.Box }
})

import { render } from '@testing-library/react'
import {
  AcknowledgeCheckbox,
  AcknowledgeControl,
  AcknowledgeLabel,
  AssetWarningBox,
  AssetWarningDescription,
  AssetWarningTextWrapper,
  AssetWarningTitle,
  BannerTextWrapper,
  ConsequenceIcon,
  ConsequenceItem,
  ConsequenceText,
  ConsequenceTitle,
  ConsequencesList,
  Container,
  DangerBanner,
  DangerBannerDescription,
  DangerBannerTitle,
  DeleteButton,
  ExportKeyDescription,
  ExportKeyLink,
  WarningCard,
  WarningDescription
} from './DeleteAccountSection.styled'

describe('DeleteAccountSection styled components', () => {
  it('renders every styled component', () => {
    render(
      <>
        <Container />
        <DangerBanner />
        <BannerTextWrapper />
        <DangerBannerTitle />
        <DangerBannerDescription />
        <WarningCard />
        <WarningDescription />
        <ConsequencesList />
        <ConsequenceItem />
        <ConsequenceIcon />
        <ConsequenceText />
        <ConsequenceTitle />
        <AssetWarningBox />
        <AssetWarningTextWrapper />
        <AssetWarningTitle />
        <AssetWarningDescription />
        <ExportKeyDescription />
        <ExportKeyLink />
        <AcknowledgeControl control={<span />} label="acknowledge" />
        <AcknowledgeCheckbox />
        <AcknowledgeLabel />
        <DeleteButton />
      </>
    )
  })
})
