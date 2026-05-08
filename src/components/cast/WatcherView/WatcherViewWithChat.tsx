import { useCallback, useState } from 'react'
import { useChatContext } from '../../../features/cast2/contexts/ChatProvider'
import { PresentationProvider } from '../../../features/cast2/contexts/PresentationContext'
import { ChatPanel } from '../ChatPanel/ChatPanel'
import { ControlsArea, MainContent, Sidebar, VideoArea, VideoContainer, ViewLayout as WatcherLayout } from '../CommonView/CommonView.styled'
import { PeopleSidebar } from '../PeopleSidebar/PeopleSidebar'
import { StreamingControls } from '../StreamingControls/StreamingControls'
import { WatcherViewContent } from './WatcherViewContent'

interface WatcherViewWithChatProps {
  onLeave: () => void
  isTabMuted: boolean
  onToggleTabMute: () => void
}

export function WatcherViewWithChat({ onLeave, isTabMuted, onToggleTabMute }: WatcherViewWithChatProps) {
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
      <WatcherLayout>
        <MainContent>
          <VideoContainer $sidebarOpen={sidebarOpen}>
            <VideoArea $sidebarOpen={sidebarOpen}>
              <WatcherViewContent />
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
              isStreamer={false}
              onLeave={onLeave}
              unreadMessagesCount={unreadMessagesCount}
              isTabMuted={isTabMuted}
              onToggleTabMute={onToggleTabMute}
            />
          </ControlsArea>
        </MainContent>
      </WatcherLayout>
    </PresentationProvider>
  )
}
