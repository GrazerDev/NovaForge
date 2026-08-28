import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Trash2, Hash, Sparkles, Terminal, Shield, Coins, Sword, Ticket, Award, MessageSquare } from 'lucide-react';
import { BotProject, SimulatedChannelMessage, DiscordEmbed, DiscordButtonComponent } from '../types';

interface DiscordChatPlaygroundProps {
  botProject: BotProject;
  onExecuteCommandInLiveDiscord?: (commandName: string) => void;
}

export const DiscordChatPlayground: React.FC<DiscordChatPlaygroundProps> = ({
  botProject,
}) => {
  const [activeChannel, setActiveChannel] = useState<'bot-commands' | 'general' | 'tickets' | 'welcome'>('bot-commands');
  const [inputVal, setInputVal] = useState('');
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [messages, setMessages] = useState<SimulatedChannelMessage[]>([
    {
      id: 'msg-welcome-intro',
      author: {
        username: botProject.name,
        avatarUrl: botProject.avatarUrl,
        isBot: true,
        botTag: 'BOT'
      },
      content: `👋 **${botProject.name}** is online and ready! Type \`/help\` or select a command below to test interactive embeds & buttons.`,
      timestamp: 'Today at ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      embeds: [
        (botProject.commands || []).find(c => c.name === 'help')?.previewEmbed || {
          title: `⚡ ${botProject.name} — Interactive Playground`,
          description: `All modules are loaded and active. Try typing commands like \`/daily\`, \`/mine\`, or \`/rank\`!`,
          color: 0x5865F2,
          footer: { text: 'NovaForge Simulator' }
        }
      ],
      components: [
        { id: 'btn_help_daily', label: 'Claim Daily 🪙', style: 'success', emoji: '🪙', actionType: 'claim_daily' },
        { id: 'btn_help_mine', label: 'Mine Ore ⛏️', style: 'primary', emoji: '⛏️', actionType: 'mine_rpg' },
        { id: 'btn_help_ticket', label: 'Open Ticket 📩', style: 'secondary', emoji: '📩', actionType: 'create_ticket' }
      ]
    }
  ]);

  const [walletBalance, setWalletBalance] = useState(1250);
  const [userXp, setUserXp] = useState(420);
  const [userLevel, setUserLevel] = useState(3);
  const [ticketCount, setTicketCount] = useState(1);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChannel]);

  // Handle typing slash command
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputVal(val);
    if (val.startsWith('/') && val.length > 0) {
      setShowSlashMenu(true);
    } else {
      setShowSlashMenu(false);
    }
  };

  // Run a command
  const executeCommand = (cmdName: string) => {
    const cleanCmd = cmdName.replace(/^\//, '').toLowerCase().trim();
    setShowSlashMenu(false);
    setInputVal('');

    const timeStr = 'Today at ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // User command message
    const userMsg: SimulatedChannelMessage = {
      id: 'usr-' + Date.now(),
      author: {
        username: 'ServerMember',
        avatarUrl: 'https://cdn.discordapp.com/embed/avatars/1.png',
        isBot: false,
        color: '#E0E7FF'
      },
      content: `/${cleanCmd}`,
      commandExecuted: `/${cleanCmd}`,
      timestamp: timeStr
    };

    let botReply: SimulatedChannelMessage;

    if (cleanCmd === 'daily') {
      const newBal = walletBalance + botProject.economy.dailyAmount;
      setWalletBalance(newBal);
      botReply = {
        id: 'bot-' + Date.now(),
        author: { username: botProject.name, avatarUrl: botProject.avatarUrl, isBot: true, botTag: 'BOT' },
        timestamp: timeStr,
        embeds: [{
          title: '☀️ Daily Reward Claimed!',
          description: `You collected your daily allowance of **+${botProject.economy.dailyAmount} ${botProject.economy.currencySymbol}**!`,
          color: 0xF1C40F,
          fields: [
            { name: '💰 Pocket Cash', value: `\`${newBal} ${botProject.economy.currencySymbol}\``, inline: true },
            { name: '🔥 Daily Streak', value: '`6 Days (1.25x)`', inline: true }
          ],
          footer: { text: 'Next reward available in 24 hours' },
          timestamp: new Date().toISOString()
        }],
        components: [
          { id: 'btn_bal_check', label: 'Check Balance', style: 'secondary', emoji: '💳', actionType: 'reply_embed' },
          { id: 'btn_shop_view', label: 'Visit Shop', style: 'primary', emoji: '🛒', actionType: 'reply_embed' }
        ]
      };
    } else if (cleanCmd === 'mine') {
      const ores = [
        { name: '💎 Diamond Cluster', value: 320, color: 0x3498DB },
        { name: '✨ Mithril Ingot', value: 210, color: 0x9B59B6 },
        { name: '🔴 Ruby Crystal', value: 160, color: 0xE74C3C },
        { name: '🪙 Pure Gold Vein', value: 120, color: 0xF1C40F }
      ];
      const drop = ores[Math.floor(Math.random() * ores.length)];
      setWalletBalance(prev => prev + drop.value);
      setUserXp(prev => prev + 45);

      botReply = {
        id: 'bot-' + Date.now(),
        author: { username: botProject.name, avatarUrl: botProject.avatarUrl, isBot: true, botTag: 'BOT' },
        timestamp: timeStr,
        embeds: [{
          title: '⛏️ Mining Expedition Complete!',
          description: `You swung your pickaxe in the deep crystal caverns and discovered **${drop.name}**!`,
          color: drop.color,
          fields: [
            { name: '💰 Value Sold', value: `\`+${drop.value} ${botProject.economy.currencySymbol}\``, inline: true },
            { name: '⭐ EXP Gained', value: '`+45 XP`', inline: true }
          ],
          footer: { text: 'Pickaxe durability: 94%' },
          timestamp: new Date().toISOString()
        }],
        components: [
          { id: 'btn_mine_again', label: 'Mine Again', style: 'primary', emoji: '⛏️', actionType: 'mine_rpg' }
        ]
      };
    } else if (cleanCmd === 'balance') {
      botReply = {
        id: 'bot-' + Date.now(),
        author: { username: botProject.name, avatarUrl: botProject.avatarUrl, isBot: true, botTag: 'BOT' },
        timestamp: timeStr,
        embeds: [{
          title: '💳 Financial Statement & Wallet',
          description: 'Account summary for **ServerMember**',
          color: 0x2ECC71,
          fields: [
            { name: '💵 Pocket Cash', value: `\`${walletBalance} ${botProject.economy.currencySymbol}\``, inline: true },
            { name: '🏦 Vault Savings', value: `\`15,000 ${botProject.economy.currencySymbol}\``, inline: true },
            { name: '📈 Net Worth', value: `\`${walletBalance + 15000} ${botProject.economy.currencySymbol}\``, inline: true }
          ],
          footer: { text: 'Bank of Discord' },
          timestamp: new Date().toISOString()
        }]
      };
    } else if (cleanCmd === 'rank') {
      botReply = {
        id: 'bot-' + Date.now(),
        author: { username: botProject.name, avatarUrl: botProject.avatarUrl, isBot: true, botTag: 'BOT' },
        timestamp: timeStr,
        embeds: [{
          title: '⭐ Player Level & XP Card',
          description: 'Progression statistics for **ServerMember**',
          color: 0x9B59B6,
          fields: [
            { name: '🏆 Current Level', value: `\`Level ${userLevel}\``, inline: true },
            { name: '📊 XP Progress', value: `\`${userXp} / ${userLevel * 200} XP\``, inline: true },
            { name: '🎖️ Leaderboard', value: '`#3 on Server`', inline: true }
          ],
          footer: { text: 'Keep chatting to earn more EXP!' },
          timestamp: new Date().toISOString()
        }]
      };
    } else if (cleanCmd === 'ticket') {
      const tNum = ticketCount;
      setTicketCount(prev => prev + 1);
      botReply = {
        id: 'bot-' + Date.now(),
        author: { username: botProject.name, avatarUrl: botProject.avatarUrl, isBot: true, botTag: 'BOT' },
        timestamp: timeStr,
        embeds: [{
          title: `📩 Ticket #00${tNum} Created`,
          description: `Your private support channel <#ticket-00${tNum}> has been dispatched! Our staff team will assist you shortly.`,
          color: 0x3498DB,
          fields: [
            { name: '👤 Creator', value: '<@ServerMember>', inline: true },
            { name: '⚡ Priority', value: '`Normal`', inline: true }
          ],
          footer: { text: 'Zenith Support Dispatcher' }
        }],
        components: [
          { id: 'btn_close_ticket', label: 'Close Ticket', style: 'danger', emoji: '🔒', actionType: 'reply_embed' }
        ]
      };
    } else if (cleanCmd === 'ping') {
      botReply = {
        id: 'bot-' + Date.now(),
        author: { username: botProject.name, avatarUrl: botProject.avatarUrl, isBot: true, botTag: 'BOT' },
        timestamp: timeStr,
        embeds: [{
          title: '🏓 Pong! Ultra Low Latency',
          description: 'Gateway connection is running at optimal speeds.',
          color: 0x57F287,
          fields: [
            { name: '⚡ REST Latency', value: '`16ms`', inline: true },
            { name: '💓 WebSocket Heartbeat', value: '`9ms`', inline: true }
          ]
        }]
      };
    } else {
      // Fallback command search
      const found = (botProject.commands || []).find(c => c.name.toLowerCase() === cleanCmd);
      botReply = {
        id: 'bot-' + Date.now(),
        author: { username: botProject.name, avatarUrl: botProject.avatarUrl, isBot: true, botTag: 'BOT' },
        timestamp: timeStr,
        embeds: [found?.previewEmbed || {
          title: `⚡ Command: /${cleanCmd}`,
          description: `Executed successfully! Configured action executed on server.`,
          color: 0x5865F2,
          footer: { text: 'NovaForge System' }
        }],
        components: found?.buttonComponents
      };
    }

    setMessages(prev => [...prev, userMsg, botReply]);
  };

  // Handle Button Click in Message
  const handleButtonClick = (button: DiscordButtonComponent) => {
    if (button.actionType === 'claim_daily') {
      executeCommand('daily');
    } else if (button.actionType === 'mine_rpg') {
      executeCommand('mine');
    } else if (button.actionType === 'dungeon_battle') {
      executeCommand('dungeon');
    } else if (button.actionType === 'blackjack_hit' || button.actionType === 'blackjack_stand') {
      executeCommand('blackjack');
    } else if (button.actionType === 'create_ticket') {
      executeCommand('ticket');
    } else {
      executeCommand(button.label.toLowerCase().replace(/[^a-z0-9]/g, '') || 'help');
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const filteredCommands = (botProject.commands || []).filter(c => 
    !inputVal.slice(1) || c.name.toLowerCase().includes(inputVal.slice(1).toLowerCase())
  );

  return (
    <div id="discord-playground-container" className="bg-[#313338] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[560px] text-left">
      {/* Left Discord Channel Sidebar */}
      <div className="w-full md:w-56 bg-[#2B2D31] border-r border-[#1F2023] flex flex-col shrink-0">
        {/* Server Header */}
        <div className="p-3.5 border-b border-[#1F2023] flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
              NF
            </div>
            <h3 className="text-xs font-bold text-white tracking-wide truncate">
              NovaForge Community
            </h3>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
        </div>

        {/* Channels List */}
        <div className="p-2 space-y-1 flex-1 overflow-y-auto text-xs font-medium">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
            Text Channels
          </div>

          <button
            onClick={() => setActiveChannel('bot-commands')}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md transition ${
              activeChannel === 'bot-commands' 
                ? 'bg-[#35373C] text-white font-semibold' 
                : 'text-slate-400 hover:bg-[#35373C]/50 hover:text-slate-200'
            }`}
          >
            <Hash className="w-3.5 h-3.5 text-slate-400" />
            <span>bot-commands</span>
          </button>

          <button
            onClick={() => setActiveChannel('general')}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md transition ${
              activeChannel === 'general' 
                ? 'bg-[#35373C] text-white font-semibold' 
                : 'text-slate-400 hover:bg-[#35373C]/50 hover:text-slate-200'
            }`}
          >
            <Hash className="w-3.5 h-3.5 text-slate-400" />
            <span>general-chat</span>
          </button>

          <button
            onClick={() => setActiveChannel('welcome')}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md transition ${
              activeChannel === 'welcome' 
                ? 'bg-[#35373C] text-white font-semibold' 
                : 'text-slate-400 hover:bg-[#35373C]/50 hover:text-slate-200'
            }`}
          >
            <Hash className="w-3.5 h-3.5 text-slate-400" />
            <span>welcome-desk</span>
          </button>

          <button
            onClick={() => setActiveChannel('tickets')}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md transition ${
              activeChannel === 'tickets' 
                ? 'bg-[#35373C] text-white font-semibold' 
                : 'text-slate-400 hover:bg-[#35373C]/50 hover:text-slate-200'
            }`}
          >
            <Hash className="w-3.5 h-3.5 text-slate-400" />
            <span>tickets-support</span>
          </button>
        </div>

        {/* User Mini Profile */}
        <div className="p-2.5 bg-[#232428] border-t border-[#1F2023] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <img
                src="https://cdn.discordapp.com/embed/avatars/1.png"
                alt="You"
                className="w-7 h-7 rounded-full bg-slate-800"
              />
              <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border border-[#232428]" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-white leading-none">ServerMember</p>
              <p className="text-[10px] text-slate-400 font-mono">Bal: {walletBalance} 🪙</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-[#313338] min-w-0">
        {/* Chat Top Navigation */}
        <div className="h-12 border-b border-[#1F2023] px-4 flex items-center justify-between shrink-0 bg-[#313338]">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-slate-400" />
            <h4 className="text-xs font-bold text-white">#{activeChannel}</h4>
            <span className="text-[11px] text-slate-400 hidden sm:inline">| Test slash commands & interactive buttons</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClearChat}
              title="Clear Chat Messages"
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-[#35373C] rounded-lg transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Command Chips */}
        <div className="px-4 py-2 bg-[#2B2D31]/70 border-b border-[#1F2023] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-semibold text-slate-400 shrink-0">Quick Run:</span>
          {(botProject.commands || []).map((cmd) => (
            <button
              key={cmd.id}
              onClick={() => executeCommand(cmd.name)}
              className="whitespace-nowrap px-2.5 py-1 rounded-md bg-[#383A40] hover:bg-[#474A51] text-indigo-300 hover:text-white text-[11px] font-mono transition border border-slate-700/50"
            >
              /{cmd.name}
            </button>
          ))}
        </div>

        {/* Messages Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className="flex items-start gap-3 group">
              <img
                src={msg.author.avatarUrl}
                alt={msg.author.username}
                className="w-9 h-9 rounded-full bg-slate-900 shrink-0 object-cover mt-0.5"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white hover:underline cursor-pointer">
                    {msg.author.username}
                  </span>
                  {msg.author.isBot && (
                    <span className="bg-[#5865F2] text-white text-[9px] font-bold px-1.5 py-0.2 rounded flex items-center">
                      BOT
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400">
                    {msg.timestamp}
                  </span>
                </div>

                {msg.content && (
                  <p className="text-xs text-slate-200 mt-1 leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>
                )}

                {/* Embed Cards */}
                {msg.embeds && msg.embeds.map((emb, idx) => (
                  <div
                    key={idx}
                    className="mt-2 bg-[#2B2D31] rounded-r-lg border-l-4 p-3.5 max-w-xl text-left shadow-sm space-y-2"
                    style={{ borderLeftColor: emb.color ? '#' + emb.color.toString(16).padStart(6, '0') : '#5865F2' }}
                  >
                    {emb.title && (
                      <h5 className="text-xs font-bold text-white tracking-tight">
                        {emb.title}
                      </h5>
                    )}

                    {emb.description && (
                      <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {emb.description}
                      </p>
                    )}

                    {/* Fields Grid */}
                    {emb.fields && emb.fields.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {emb.fields.map((f, fIdx) => (
                          <div key={fIdx} className="bg-[#232428]/60 p-2 rounded border border-[#1F2023]">
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">{f.name}</span>
                            <span className="text-xs font-medium text-slate-200 whitespace-pre-wrap">{f.value}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {emb.footer && (
                      <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-700/40">
                        {emb.footer.text}
                      </div>
                    )}
                  </div>
                ))}

                {/* Interactive Discord Buttons */}
                {msg.components && msg.components.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2.5">
                    {msg.components.map((btn) => (
                      <button
                        key={btn.id}
                        onClick={() => handleButtonClick(btn)}
                        className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition shadow-sm ${
                          btn.style === 'success'
                            ? 'bg-[#248046] hover:bg-[#1A6334] text-white'
                            : btn.style === 'danger'
                            ? 'bg-[#DA373C] hover:bg-[#A12828] text-white'
                            : btn.style === 'secondary'
                            ? 'bg-[#4E5058] hover:bg-[#6D6F78] text-white'
                            : 'bg-[#5865F2] hover:bg-[#4752C4] text-white'
                        }`}
                      >
                        {btn.emoji && <span>{btn.emoji}</span>}
                        <span>{btn.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar with Slash Command Autocomplete Popover */}
        <div className="p-3 bg-[#313338] border-t border-[#1F2023] relative">
          {showSlashMenu && (
            <div className="absolute bottom-16 left-3 right-3 bg-[#2B2D31] border border-slate-700 rounded-xl shadow-2xl p-2 max-h-56 overflow-y-auto space-y-1 z-30 animate-in fade-in slide-in-from-bottom-2">
              <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider flex items-center justify-between">
                <span>Matching Slash Commands</span>
                <span className="text-indigo-400 font-mono">Press Enter or Click</span>
              </div>
              {filteredCommands.length > 0 ? (
                filteredCommands.map((cmd) => (
                  <button
                    key={cmd.id}
                    onClick={() => executeCommand(cmd.name)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#35373C] flex items-center justify-between group transition"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-indigo-400 group-hover:text-white">
                        /{cmd.name}
                      </span>
                      <span className="text-xs text-slate-400 truncate max-w-xs">
                        {cmd.description}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded uppercase">
                      {cmd.category}
                    </span>
                  </button>
                ))
              ) : (
                <div className="text-xs text-slate-400 p-2 text-center">
                  No matching command found. Type any custom message or press Enter.
                </div>
              )}
            </div>
          )}

          <div className="relative flex items-center">
            <input
              id="input-chat-playground"
              type="text"
              value={inputVal}
              onChange={handleInputChange}
              placeholder={`Message #${activeChannel} (type / for commands like /help, /daily, /mine)`}
              className="w-full bg-[#383A40] text-slate-100 placeholder:text-slate-500 text-xs rounded-lg pl-4 pr-12 py-3 outline-none focus:ring-1 focus:ring-indigo-500 transition"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (inputVal.startsWith('/')) {
                    executeCommand(inputVal);
                  } else if (inputVal.trim()) {
                    // Send normal user text
                    const timeStr = 'Today at ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    setMessages(prev => [
                      ...prev,
                      {
                        id: 'usr-' + Date.now(),
                        author: { username: 'ServerMember', avatarUrl: 'https://cdn.discordapp.com/embed/avatars/1.png', isBot: false },
                        content: inputVal,
                        timestamp: timeStr
                      }
                    ]);
                    setInputVal('');
                  }
                }
              }}
            />

            <button
              onClick={() => {
                if (inputVal.startsWith('/')) {
                  executeCommand(inputVal);
                } else if (inputVal.trim()) {
                  const timeStr = 'Today at ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  setMessages(prev => [
                    ...prev,
                    {
                      id: 'usr-' + Date.now(),
                      author: { username: 'ServerMember', avatarUrl: 'https://cdn.discordapp.com/embed/avatars/1.png', isBot: false },
                      content: inputVal,
                      timestamp: timeStr
                    }
                  ]);
                  setInputVal('');
                }
              }}
              className="absolute right-2 p-2 text-slate-400 hover:text-white transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
