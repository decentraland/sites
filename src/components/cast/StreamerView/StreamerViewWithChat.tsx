import { useCallback, useState } from 'react'
import { useChatContext } from '../../../features/media/cast/contexts/ChatProvider'
import { PresentationProvider } from '../../../features/media/cast/contexts/PresentationContext'
import { ChatPanel } from '../ChatPanel/ChatPanel'
import {
  ControlsArea,
  MainContent,
  Sidebar,
  ViewLayout as StreamerLayout,
  VideoArea,
  VideoContainer
} from '../CommonView/CommonView.styled'
import { PeopleSidebar } from '../PeopleSidebar/PeopleSidebar'
import { PresentationControls } from '../PresentationControls/PresentationControls'
import { StreamingControls } from '../StreamingControls/StreamingControls'
import { StreamerViewContent } from './StreamerViewContent'

interface StreamerViewWithChatProps {
  onLeave: () => void
  isTabMuted: boolean
  onToggleTabMute: () => void
}

export function StreamerViewWithChat({ onLeave, isTabMuted, onToggleTabMute }: StreamerViewWithChatProps) {
  const [peopleOpen, setPeopleOpen] = useState(false)
  const { chatMessages, unreadMessagesCount, markMessagesAsRead, isChatOpen, setChatOpen } = useChatContext()

  const sidebarOpen = isChatOpen || peopleOpen

  const handleToggleChat = useCallback(() => {
    if (peopleOpen) setPeopleOpen(false)
    setChatOpen(!isChatOpen)
  }, [peopleOpen, isChatOpen, setChatOpen])

  const handleTogglePeople = useCallback(() => {
    if (isChatOpen) setChatOpen(false)
    setPeopleOpen(!peopleOpen)
  }, [isChatOpen, peopleOpen, setChatOpen])

  return (
    <PresentationProvider>
      <StreamerLayout>
        <MainContent>
          <VideoContainer $sidebarOpen={sidebarOpen}>
            <VideoArea $sidebarOpen={sidebarOpen}>
              <StreamerViewContent />
              <PresentationControls />
            </VideoArea>

            <Sidebar $isOpen={sidebarOpen}>
              {isChatOpen && <ChatPanel onClose={handleToggleChat} chatMessages={chatMessages} onMessagesRead={markMessagesAsRead} />}
              {peopleOpen && <PeopleSidebar onClose={handleTogglePeople} />}
            </Sidebar>
          </VideoContainer>

          <ControlsArea>
            <StreamingControls
              onToggleChat={handleToggleChat}
              onTogglePeople={handleTogglePeople}
              isStreamer
              onLeave={onLeave}
              unreadMessagesCount={unreadMessagesCount}
              isTabMuted={isTabMuted}
              onToggleTabMute={onToggleTabMute}
            />
          </ControlsArea>
        </MainContent>
      </StreamerLayout>
    </PresentationProvider>
  )
}
