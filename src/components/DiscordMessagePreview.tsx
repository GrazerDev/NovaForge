import React from 'react';
import { DiscordMessagePayload, DiscordEmbed } from '../types';
import { Bot, ExternalLink, Calendar, Info } from 'lucide-react';

interface DiscordPreviewProps {
  payload: DiscordMessagePayload;
  onChangePayload?: (updated: DiscordMessagePayload) => void;
  isEditable?: boolean;
}

export const DiscordMessagePreview: React.FC<DiscordPreviewProps> = ({
  payload,
  onChangePayload,
  isEditable = false,
}) => {
  const username = payload.username || 'Discord Bot';
  const avatarUrl = payload.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png';
  const embeds = payload.embeds || [];

  const formatColor = (colorNum?: number): string => {
    if (colorNum === undefined || colorNum === null) return '#5865F2';
    return `#${colorNum.toString(16).padStart(6, '0')}`;
  };

  const renderSimpleMarkdown = (text: string) => {
    if (!text) return null;

    // Split by newlines
    const lines = text.split('\n');
    return (
      <div className="space-y-1 text-[#dbdee1] leading-relaxed break-words text-[14px]">
        {lines.map((line, idx) => {
          // Format bold **text**
          const boldFormatted = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>');
          // Format code `code`
          const codeFormatted = boldFormatted.replace(/`([^`]+)`/g, '<code class="bg-[#1e1f22] text-[#f2f3f5] px-1 py-0.5 rounded text-xs font-mono">$1</code>');
          // Format quotes > text
          if (line.startsWith('> ')) {
            return (
              <div key={idx} className="border-l-4 border-[#4e5058] pl-2 text-[#949ba4] italic my-1">
                <span dangerouslySetInnerHTML={{ __html: codeFormatted.replace(/^>\s*/, '') }} />
              </div>
            );
          }
          return <div key={idx} dangerouslySetInnerHTML={{ __html: codeFormatted || '&nbsp;' }} />;
        })}
      </div>
    );
  };

  return (
    <div id="discord-preview-container" className="rounded-xl bg-[#313338] border border-[#3f4147] shadow-xl overflow-hidden font-sans text-left">
      {/* Discord Header Bar */}
      <div className="bg-[#2b2d31] px-4 py-2.5 border-b border-[#1f2023] flex items-center justify-between text-xs text-[#949ba4]">
        <div className="flex items-center gap-2">
          <span className="text-[#80848e] font-bold text-sm">#</span>
          <span className="font-semibold text-white">scheduled-announcements</span>
          <span className="hidden sm:inline text-[11px] bg-[#1e1f22] text-[#b5bac1] px-1.5 py-0.5 rounded">
            Discord UI Simulator
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live Rendering</span>
        </div>
      </div>

      {/* Message Row */}
      <div className="p-4 sm:p-5 flex items-start gap-4">
        {/* Avatar */}
        <div className="relative shrink-0">
          <img
            src={avatarUrl}
            alt={username}
            referrerPolicy="no-referrer"
            className="w-10 h-10 rounded-full bg-[#1e1f22] object-cover ring-2 ring-transparent hover:ring-[#5865F2] transition"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://cdn.discordapp.com/embed/avatars/0.png';
            }}
          />
        </div>

        {/* Message Content & Embeds */}
        <div className="flex-1 min-w-0">
          {/* Author Header */}
          <div className="flex items-center flex-wrap gap-1.5 mb-1.5">
            <span className="font-semibold text-white text-[15px] hover:underline cursor-pointer">
              {username}
            </span>
            <span className="inline-flex items-center gap-0.5 bg-[#5865F2] text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
              <Bot className="w-3 h-3 inline mr-0.5" />
              BOT
            </span>
            <span className="text-[#949ba4] text-xs ml-1">
              Today at 12:00 PM (Scheduled Cron)
            </span>
          </div>

          {/* Text Message Content */}
          {payload.content && (
            <div className="mb-3 text-[14px] text-[#dbdee1]">
              {renderSimpleMarkdown(payload.content)}
            </div>
          )}

          {/* Embeds */}
          <div className="space-y-3">
            {embeds.map((embed: DiscordEmbed, index: number) => {
              const borderCol = formatColor(embed.color);

              return (
                <div
                  key={index}
                  id={`discord-embed-${index}`}
                  className="rounded-lg bg-[#2b2d31] border border-[#1e1f22] p-4 max-w-2xl relative shadow-md overflow-hidden"
                  style={{ borderLeft: `4px solid ${borderCol}` }}
                >
                  {/* Author */}
                  {embed.author && (
                    <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-white">
                      {embed.author.icon_url && (
                        <img
                          src={embed.author.icon_url}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="w-5 h-5 rounded-full object-cover"
                        />
                      )}
                      {embed.author.url ? (
                        <a
                          href={embed.author.url}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline text-[#00a8fc]"
                        >
                          {embed.author.name}
                        </a>
                      ) : (
                        <span>{embed.author.name}</span>
                      )}
                    </div>
                  )}

                  {/* Title */}
                  {embed.title && (
                    <div className="text-[16px] font-bold text-white mb-2 leading-snug">
                      {embed.url ? (
                        <a
                          href={embed.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#00a8fc] hover:underline inline-flex items-center gap-1"
                        >
                          {embed.title}
                          <ExternalLink className="w-3.5 h-3.5 inline" />
                        </a>
                      ) : (
                        embed.title
                      )}
                    </div>
                  )}

                  {/* Description */}
                  {embed.description && (
                    <div className="mb-3">
                      {renderSimpleMarkdown(embed.description)}
                    </div>
                  )}

                  {/* Fields Grid */}
                  {embed.fields && embed.fields.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 my-3">
                      {embed.fields.map((field, fIdx) => (
                        <div
                          key={fIdx}
                          className={field.inline ? 'col-span-1' : 'col-span-full'}
                        >
                          <div className="text-xs font-bold text-[#b5bac1] uppercase tracking-wider mb-0.5">
                            {field.name}
                          </div>
                          <div className="text-xs text-[#dbdee1] leading-relaxed">
                            {renderSimpleMarkdown(field.value)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Large Image */}
                  {embed.image?.url && (
                    <div className="my-3 rounded overflow-hidden max-h-72">
                      <img
                        src={embed.image.url}
                        alt="Embed attachment"
                        referrerPolicy="no-referrer"
                        className="max-h-72 w-full object-cover rounded"
                      />
                    </div>
                  )}

                  {/* Footer & Timestamp */}
                  {(embed.footer || embed.timestamp) && (
                    <div className="flex items-center gap-2 text-[11px] text-[#949ba4] mt-3 pt-2 border-t border-[#35373c]/60">
                      {embed.footer?.icon_url && (
                        <img
                          src={embed.footer.icon_url}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="w-4 h-4 rounded-full"
                        />
                      )}
                      <span>{embed.footer?.text || 'Automated Discord Bot'}</span>
                      {embed.timestamp && (
                        <>
                          <span>•</span>
                          <span>{new Date(embed.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Editor Controls if editable */}
      {isEditable && onChangePayload && (
        <div className="bg-[#232428] px-4 py-3 border-t border-[#1f2023] text-xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[#949ba4]">
            <Info className="w-4 h-4 text-blue-400" />
            <span>Customize message header and text to test formatting live.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="btn-update-timestamp"
              onClick={() => {
                const updatedEmbeds = (payload.embeds || []).map(e => ({
                  ...e,
                  timestamp: new Date().toISOString()
                }));
                onChangePayload({ ...payload, embeds: updatedEmbeds });
              }}
              className="px-2.5 py-1 bg-[#35373c] hover:bg-[#404249] text-white rounded text-[11px] font-medium transition"
            >
              Refresh Timestamp
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
