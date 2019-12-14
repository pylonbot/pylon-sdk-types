/**
 * # Discord SDK
 *
 * The `discord` module is exposed on the global scope within the Pylon runtime.
 *
 * ### Common Classes
 * The most common classes you may work with are:
 * - [[discord.Guild]]
 * - [[discord.GuildChannel]]
 * - [[discord.GuildMember]]
 * - [[discord.Message]]
 * - [[discord.TextChannel]]
 * - [[discord.User]]
 *
 * ### Events
 * Events are executed as they are recieved from the [Discord Gateway](https://discordapp.com/developers/docs/topics/gateway#commands-and-events).
 * You can register event handlers within the Pylon runtime.
 * See [[discord.registerEventHandler]] for a list of events and their respective payloads.
 *
 * #### Basic Event Handler
 *
 * ```typescript
 * // Register the MESSAGE_CREATE event. Notice the the 'async' keyword.
 * discord.registerEventHandler(discord.Event.MESSAGE_CREATE, async (message) => {
 *   // We don't want to respond to bots.
 *   if (message.author.bot) {
 *     return;
 *   }
 *
 *   // A simple '!ping' command.
 *   if (message.content.startsWith("!ping")) {
 *     // Ensure you always 'await' async (Promise) actions.
 *     await message.reply("Pong!")
 *   }
 * })
 *
 */

declare module discord {
  type Snowflake = string;

  interface IMentionable {
    toMention(): string;
  }

  class User implements IMentionable {
    readonly id: Snowflake;
    readonly username: string;
    readonly discriminator: string;
    readonly avatar: string | null;
    readonly bot: boolean;

    getAvatarUrl(type?: discord.ImageType): string;
    getTag(): string;

    toMention(): string;
  }

  enum ImageType {
    PNG = "png",
    JPEG = "jpeg",
    WEBP = "webp",
    GIF = "gif"
  }

  namespace Guild {
    interface IGuildOptions {
      name?: string;
      region?: Guild.Region;
      verificationLevel?: number;
      defaultMessageNotifications?: number;
      explicitContentFilter?: number;
      afkChannelId?: Snowflake | null;
      afkTimeout?: number;
      icon?: string | null;
      ownerId?: Snowflake;
      splash?: string | null;
      banner?: string | null;
      systemChannelId?: Snowflake | null;
    }

    type CreateChannelOptions =
      | (GuildCategory.IGuildCategoryOptions & {
          type: Channel.Type.GUILD_CATEGORY;
        })
      | (GuildTextChannel.IGuildTextChannelOptions & {
          type: Channel.Type.GUILD_TEXT;
        })
      | (GuildVoiceChannel.IGuildVoiceChannelOptions & {
          type: Channel.Type.GUILD_VOICE;
        })
      | (GuildNewsChannel.IGuildNewsChannelOptions & {
          type: Channel.Type.GUILD_NEWS;
        })
      | (GuildStoreChannel.IGuildStoreChannelOptions & {
          type: Channel.Type.GUILD_STORE;
        });

    interface IGuildBanOptions {
      deleteMessageDays?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
      reason?: string;
    }

    enum Feature {
      INVITE_SPLASH = "INVITE_SPLASH",
      VIP_REGIONS = "VIP_REGIONS",
      VANITY_URL = "VANITY_URL",
      VERIFIED = "VERIFIED",
      PARTNERED = "PARTNERED",
      PUBLIC = "PUBLIC",
      COMMERCE = "COMMERCE",
      NEWS = "NEWS",
      DISCOVERABLE = "DISCOVERABLE",
      FEATURABLE = "FEATURABLE",
      ANIMATED_ICON = "ANIMATED_ICON",
      BANNER = "BANNER"
    }

    enum Region {
      US_EAST = "us-east"
      // todo: fill in rest.
    }

    enum NotificationsLevel {
      ALL_MESSAGES = 0,
      ONLY_MENTIONS = 1
    }

    enum ExplicitContentFilterLevel {
      DISABLED = 0,
      MEMBERS_WITHOUT_ROLES = 1,
      ALL_MENTIONS = 2
    }

    enum MFALevel {
      NONE = 0,
      ELEVATED = 1
    }

    enum VerificationLevel {
      NONE = 0,
      LOW = 1,
      MEDIUM = 2,
      HIGH = 3,
      VERY_HIGH = 4
    }

    enum PremiumTier {
      NONE = 0,
      TIER_1 = 1,
      TIER_2 = 2,
      TIER_3 = 3
    }
  }

  class Guild implements Readonly<Required<Guild.IGuildOptions>> {
    readonly id: Snowflake;
    readonly name: string;
    readonly region: Guild.Region;
    readonly verificationLevel: number;
    readonly defaultMessageNotifications: number;
    readonly explicitContentFilter: number;
    readonly afkChannelId: Snowflake | null;
    readonly afkTimeout: number;
    readonly icon: string | null;
    readonly ownerId: Snowflake;
    readonly splash: string | null;
    readonly banner: string | null;
    readonly systemChannelId: Snowflake | null;
    readonly permissions?: number;
    readonly features: Array<Guild.Feature>;
    readonly mfaLevel: number;
    readonly applicationId: Snowflake | null;
    readonly widgetEnabled: boolean;
    readonly widgetChannelId: Snowflake | null;
    readonly maxPresences: number;
    readonly maxMembers: number | null;
    readonly vanityUrlCode: string | null;
    readonly description: string | null;
    readonly premiumTier: Guild.PremiumTier | null;
    readonly premiumSubscriptionCount: number;
    readonly preferredLocale: string;

    edit(updateData: Guild.IGuildOptions): Promise<Guild>;

    getChannel(channelId: Snowflake): Promise<Channel.AnyGuildChannel>;
    createChannel(options: Guild.CreateChannelOptions): Promise<Channel.AnyGuildChannel>;

    createBan(userId: Snowflake, options?: discord.Guild.IGuildBanOptions): Promise<void>;

    getRoles(): Promise<Role[]>;
    getRole(roleId: Snowflake): Promise<Role>;

    getMember(userId: Snowflake): Promise<GuildMember>;

    getIconUrl(type?: discord.ImageType): string | null;
    getSplashUrl(
      type?: discord.ImageType.PNG | discord.ImageType.JPEG | discord.ImageType.WEBP
    ): string | null;
    getBannerUrl(
      type?: discord.ImageType.PNG | discord.ImageType.JPEG | discord.ImageType.WEBP
    ): string | null;
  }

  namespace GuildMember {
    type GuildMemberUser = Partial<User> & Pick<User, "id">;

    interface IGuildMemberOptions {
      nick?: string;
      roles?: Snowflake[];
      mute?: boolean;
      deaf?: boolean;
      channelId?: Snowflake;
    }
  }

  class GuildMember implements IMentionable {
    readonly user: GuildMember.GuildMemberUser;
    readonly nick: string | null;
    readonly roles: Array<Snowflake>;
    readonly joinedAt: string;
    readonly premiumSince: string | null;
    readonly deaf: boolean;
    readonly mute: boolean;
    readonly guildId: Snowflake;

    getUser(): Promise<User>;
    getGuild(): Promise<Guild>;

    edit(options: GuildMember.IGuildMemberOptions): Promise<void>;

    addRole(roleId: Snowflake): Promise<void>;
    removeRole(roleId: Snowflake): Promise<void>;

    kick(): Promise<void>;
    ban(options?: discord.Guild.IGuildBanOptions): Promise<void>;

    toMention(): string;
  }

  namespace Role {
    interface IRoleOptions {
      name?: string;
      permissions?: number;
      color?: number;
      hoist?: boolean;
      mentionable?: boolean;
    }
  }

  class Role implements IMentionable {
    readonly id: Snowflake;
    readonly name: string;
    readonly color: number;
    readonly hoist: boolean;
    readonly position: number;
    readonly permissions: number;
    readonly managed: boolean;
    readonly mentionable: boolean;
    readonly guildId: Snowflake;

    edit(options: Role.IRoleOptions): Promise<Role>;
    delete(): Promise<void>;

    toMention(): string;
  }

  /* Channel (Base Channel) */

  namespace Channel {
    type AnyGuildChannel =
      | GuildTextChannel
      | GuildVoiceChannel
      | GuildCategory
      | GuildNewsChannel
      | GuildStoreChannel;

    type AnyChannel = DmChannel | AnyGuildChannel;

    interface IPermissionOverwrite {
      id: Snowflake;
      type: Channel.PermissionOverwriteType;
      allow: number;
      deny: number;
    }

    const enum PermissionOverwriteType {
      ROLE = "role",
      // todo: is this right?
      MEMBER = "member"
    }

    const enum Type {
      GUILD_TEXT = 0,
      DM = 1,
      GUILD_VOICE = 2,
      GROUP_DM = 3,
      GUILD_CATEGORY = 4,
      GUILD_NEWS = 5,
      GUILD_STORE = 6
    }
  }

  class Channel {
    readonly id: Snowflake;
    readonly type: Channel.Type;

    delete(): Promise<void>;
  }

  /* TextChannel (Channel that has text messaging) */

  class TextChannel extends Channel {
    readonly type: Channel.Type;

    getMessage(messageId: string): Promise<Message | null>;
    sendMessage(
      messageData:
        | discord.Message.OutgoingMessage
        | Promise<discord.Message.OutgoingMessage>
        | (() => Promise<discord.Message.OutgoingMessage>)
    ): Promise<Message>;
    triggerTypingIndicator(): Promise<void>;
  }

  /* DmChannel */

  class DmChannel extends Channel implements TextChannel {
    readonly type: Channel.Type.DM;

    getMessage(messageId: string): Promise<Message | null>;
    sendMessage(
      messageData:
        | discord.Message.OutgoingMessage
        | Promise<discord.Message.OutgoingMessage>
        | (() => Promise<discord.Message.OutgoingMessage>)
    ): Promise<Message>;
    triggerTypingIndicator(): Promise<void>;
  }

  /* GuildChannel */

  namespace GuildChannel {
    interface IGuildChannelOptions {
      position?: number;
      permissionOverwrites?: Array<Channel.IPermissionOverwrite>;
      parentId?: Snowflake | null;
      name?: string;
    }
  }

  class GuildChannel extends Channel implements IMentionable {
    readonly guildId: Snowflake;
    readonly position: number;
    readonly permissionOverwrites: Array<Channel.IPermissionOverwrite>;
    readonly parentId: Snowflake | null;
    readonly name: string;
    readonly type:
      | Channel.Type.GUILD_CATEGORY
      | Channel.Type.GUILD_TEXT
      | Channel.Type.GUILD_NEWS
      | Channel.Type.GUILD_STORE
      | Channel.Type.GUILD_VOICE;

    edit(updateData: GuildChannel.IGuildChannelOptions): Promise<Channel.AnyGuildChannel>;
    delete(): Promise<void>;

    toMention(): string;
  }

  /* GuildTextChannel */

  namespace GuildTextChannel {
    interface IGuildTextChannelOptions extends GuildChannel.IGuildChannelOptions {
      topic?: string;
      nsfw?: boolean;
      rateLimitPerUser?: number | null;
    }
  }

  class GuildTextChannel extends GuildChannel implements TextChannel {
    readonly topic: string | null;
    readonly nsfw: boolean;
    readonly rateLimitPerUser: number | null;
    readonly type: Channel.Type.GUILD_TEXT;

    edit(updateData: GuildTextChannel.IGuildTextChannelOptions): Promise<GuildTextChannel>;
    delete(): Promise<void>;

    getMessage(messageId: string): Promise<Message | null>;
    sendMessage(
      messageData:
        | discord.Message.OutgoingMessage
        | Promise<discord.Message.OutgoingMessage>
        | (() => Promise<discord.Message.OutgoingMessage>)
    ): Promise<Message>;
    triggerTypingIndicator(): Promise<void>;
  }

  /* GuildVoiceChannel */

  namespace GuildVoiceChannel {
    interface IGuildVoiceChannelOptions extends GuildChannel.IGuildChannelOptions {
      bitrate?: number;
      userLimit?: number;
    }
  }

  class GuildVoiceChannel extends GuildChannel {
    readonly bitrate: number;
    readonly userLimit: number;
    readonly type: Channel.Type.GUILD_VOICE;

    edit(updateData: GuildVoiceChannel.IGuildVoiceChannelOptions): Promise<GuildVoiceChannel>;
    delete(): Promise<void>;
  }

  /* GuildCateogry */

  namespace GuildCategory {
    interface IGuildCategoryOptions extends GuildChannel.IGuildChannelOptions {
      parent?: null;
    }
  }

  class GuildCategory extends GuildChannel {
    readonly type: Channel.Type.GUILD_CATEGORY;

    edit(updateData: GuildCategory.IGuildCategoryOptions): Promise<GuildCategory>;
    delete(): Promise<void>;
  }

  /* GuildNewsChannel */

  namespace GuildNewsChannel {
    interface IGuildNewsChannelOptions extends GuildChannel.IGuildChannelOptions {
      topic?: string | null;
      nsfw?: boolean;
    }
  }

  class GuildNewsChannel extends GuildChannel implements TextChannel {
    readonly topic: string | null;
    readonly nsfw: boolean;
    readonly type: Channel.Type.GUILD_NEWS;

    edit(updateData: GuildNewsChannel.IGuildNewsChannelOptions): Promise<GuildNewsChannel>;
    delete(): Promise<void>;

    getMessage(messageId: string): Promise<Message | null>;
    sendMessage(
      messageData:
        | discord.Message.OutgoingMessage
        | Promise<discord.Message.OutgoingMessage>
        | (() => Promise<discord.Message.OutgoingMessage>)
    ): Promise<Message>;
    triggerTypingIndicator(): Promise<void>;
  }

  /* GuildStoreChannel */

  namespace GuildStoreChannel {
    interface IGuildStoreChannelOptions extends GuildChannel.IGuildChannelOptions {}
  }

  class GuildStoreChannel extends GuildChannel {
    readonly type: Channel.Type.GUILD_STORE;

    edit(updateData: GuildStoreChannel.IGuildStoreChannelOptions): Promise<GuildStoreChannel>;
    delete(): Promise<void>;
  }

  namespace Embed {
    interface IEmbedFooter {
      text: string;
      iconUrl?: string;
      proxyIconUrl?: string;
    }

    // interface IDimensions {
    //   height?: number;
    //   width?: number;
    // }

    // interface IUrl {

    // }

    // interface IProxyUrl {
    //   proxyUrl?: string;
    // }

    interface IEmbedImage {
      url?: string;
      proxyUrl?: string;
      height?: number;
      width?: number;
    }

    interface IEmbedImage {
      url?: string;
      proxyUrl?: string;
      height?: number;
      width?: number;
    }

    interface IEmbedThumbnail {
      url?: string;
      proxyUrl?: string;
      height?: number;
      width?: number;
    }

    interface IEmbedVideo {
      url?: string;
      height?: number;
      width?: number;
    }

    interface IEmbedProvider {
      url?: string;
      name?: string;
    }

    interface IEmbedAuthor {
      url?: string;
      name?: string;
      iconUrl?: string;
      proxyIconUrl?: string;
    }

    interface IEmbedField {
      name: string;
      value: string;
      inline: boolean;
    }

    interface IEmbed {
      title?: string;
      type?: string;
      description?: string;
      url?: string;
      timestamp?: string;
      color?: number;
      footer?: Embed.IEmbedFooter;
      image?: Embed.IEmbedImage;
      thumbnail?: Embed.IEmbedThumbnail;
      video?: Embed.IEmbedVideo;
      provider?: Embed.IEmbedProvider;
      author?: Embed.IEmbedAuthor;
      fields?: Array<Embed.IEmbedField>;
    }
  }

  class Embed {
    title: string | null;
    type: string | null;
    description: string | null;
    url: string | null;
    timestamp: string | null;
    color: number | null;
    footer: Embed.IEmbedFooter | null;
    image: Embed.IEmbedImage | null;
    thumbnail: Embed.IEmbedImage | null;
    video: Embed.IEmbedVideo | null;
    provider: Embed.IEmbedProvider | null;
    author: Embed.IEmbedAuthor | null;
    fields: Embed.IEmbedField[];

    constructor(init?: Embed.IEmbed);

    setTitle(title: string | null): Embed;
    setType(type: string | null): Embed;
    setDescription(description: string | null): Embed;
    setUrl(url: string | null): Embed;
    setTimestamp(timestamp: string | null): Embed;
    setColor(color: number | null): Embed;
    setFooter(footer: Embed.IEmbedFooter | null): Embed;
    setImage(image: Embed.IEmbedImage | null): Embed;
    setThumbnail(thumbnail: Embed.IEmbedThumbnail | null): Embed;
    setVideo(video: Embed.IEmbedVideo | null): Embed;
    setProvider(provider: Embed.IEmbedProvider | null): Embed;
    setAuthor(author: Embed.IEmbedAuthor | null): Embed;
    setFields(fields: Embed.IEmbedField[]): Embed;

    addField(field: Embed.IEmbedField): Embed;
  }

  namespace Emoji {
    interface IEmoji {
      id: Snowflake | null;
      name: string;
    }

    interface IGuildEmoji extends IEmoji {
      type: Emoji.Type.GUILD;
      id: Snowflake;
      name: string;
      roles?: Array<Snowflake>;
      user?: User;
      requireColons?: boolean;
      managed?: boolean;
      animated?: boolean;
    }

    interface IUnicodeEmoji extends IEmoji {
      type: Emoji.Type.UNICODE;
      id: null;
      name: string;
    }

    enum Type {
      GUILD = "GUILD",
      UNICODE = "UNICODE"
    }

    type AnyEmoji = Emoji.IGuildEmoji | Emoji.IUnicodeEmoji;
  }

  class Emoji implements Emoji.IEmoji, IMentionable {
    readonly id: Snowflake | null;
    readonly name: string;
    readonly type: Emoji.Type;
    readonly roles: Snowflake[];
    readonly user: User | null;
    readonly requireColons: boolean;
    readonly managed: boolean;
    readonly animated: boolean;

    toString(): string;

    toMention(): string;
  }

  /* Message */

  namespace Message {
    const enum Type {
      DEFAULT = 0,
      CHANNEL_PINNED_MESSAGE = 4,
      GUILD_MEMBER_JOIN = 7,
      USER_PREMIUM_GUILD_SUBSCRIPTION = 8,
      USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_1 = 9,
      USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_2 = 10,
      USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_3 = 11,
      CHANNEL_FOLLOW_ADD = 12
    }

    const enum Flags {
      CROSSPOSTED = 1 << 0,
      IS_CROSSPOST = 1 << 1,
      SUPPRESS_EMBEDS = 1 << 2
    }

    const enum ActivityType {
      JOIN = 1,
      SPECTATE = 2,
      LISTEN = 3,
      JOIN_REQUEST = 5
    }

    interface IMessageReaction {
      count: number;
      me: boolean;
      emoji: Emoji;
    }

    interface IMessageChannelMention {
      id: Snowflake;
      guildId: Snowflake;
      type: Channel.Type;
      name: string;
    }

    interface IMessageAttachment {
      id: Snowflake;
      filename: string;
      size: number;
      url: string;
      proxyUrl: string;
      height?: number;
      width?: number;
    }

    interface IMessageActivity {
      type: Message.ActivityType;
      partyId?: string;
    }

    interface IMessageApplication {
      id: Snowflake;
      coverImage?: string;
      description: string;
      icon: string | null;
      name: string;
    }

    interface IMessageReference {
      messageId?: Snowflake;
      channelId?: Snowflake;
      guildId?: Snowflake;
    }

    interface IOutgoingMessageOptions {
      content: string;
      tts?: boolean;
      embed?: Embed | Embed.IEmbed;
    }

    type OutgoingMessage = string | IOutgoingMessageOptions;
  }

  class Message {
    readonly id: Snowflake;
    readonly channelId: Snowflake;
    readonly guildId: Snowflake | null;
    readonly content: string | null;
    readonly author: User | null;
    readonly member: GuildMember | null;
    readonly timestamp: string;
    readonly editedTimestamp: string | null;
    readonly mentionEveryone: boolean;
    readonly mentions: (User & { member: Omit<GuildMember, "user"> })[];
    readonly mentionRoles: Array<Snowflake>;
    readonly mentionChannels: Array<Message.IMessageChannelMention>;
    readonly attachments: Array<Message.IMessageAttachment>;
    readonly reactions: Array<Message.IMessageReaction>;
    readonly pinned: boolean;
    readonly webhookId: Snowflake | null;
    readonly type: Message.Type;
    readonly activity: Message.IMessageActivity | null;
    readonly application: Message.IMessageApplication | null;
    readonly messageReference: Message.IMessageReference | null;
    readonly flags: Message.Flags | null;

    getGuild(): Promise<Guild | null>;
    getChannel(): Promise<
      discord.DmChannel | (discord.GuildTextChannel | discord.GuildNewsChannel) | null
    >;

    reply(
      messageData:
        | discord.Message.OutgoingMessage
        | Promise<discord.Message.OutgoingMessage>
        | (() => Promise<discord.Message.OutgoingMessage>)
    ): Promise<Message>;
    delete(): Promise<void>;

    addReaction(emoji: string): Promise<void>;
    deleteOwnReaction(emoji: string): Promise<void>;
    deleteReaction(emoji: string, user: Snowflake | User): Promise<void>;

    edit(messageData: Message.OutgoingMessage): Promise<Message>;

    setPinned(pinned: boolean): Promise<void>;
  }

  class VoiceState {
    guildId: Snowflake;
    channelId: Snowflake;
    userId: Snowflake;
    member: GuildMember;
    sessionId?: string;
    deaf: boolean;
    mute: boolean;
    selfDeaf: boolean;
    selfMute: boolean;
    selfStream: boolean;
  }

  namespace Event {
    type EventListener<T> = (evt: T) => unknown;

    interface IMessageDelete {
      id: Snowflake;
      channelId: Snowflake;
      guildId?: Snowflake;
    }

    interface IMessageDeleteBulk {
      ids: Array<Snowflake>;
      channelId: Snowflake;
      guildId?: Snowflake;
    }

    interface IMessageReactionAdd {
      userId: Snowflake;
      channelId: Snowflake;
      messageId: Snowflake;
      guildId?: Snowflake;
      emoji: Partial<Emoji>;
    }

    interface IMessageReactionRemove {
      userId: Snowflake;
      channelId: Snowflake;
      messageId: Snowflake;
      guildId?: Snowflake;
      emoji: Partial<Emoji>;
    }

    interface IMessageReactionRemoveAll {
      channelId: Snowflake;
      messageId: Snowflake;
      guildId?: Snowflake;
    }

    interface IGuildMemberRemove {
      guildId: Snowflake;
      user: User;
    }

    interface IGuildMemberUpdate {
      guildId: Snowflake;
      roles: Array<Snowflake>;
      user: User;
      nick: string;
    }

    interface IGuildBanAdd {
      guildId: Snowflake;
      user: User;
    }

    interface IGuildBanRemove {
      guildId: Snowflake;
      user: User;
    }

    interface IGuildEmojisUpdate {
      guildId: Snowflake;
      emojis: Array<Emoji>;
    }

    interface IGuildIntegrationsUpdate {
      guildId: Snowflake;
    }

    interface IGuildRoleCreate {
      guildId: Snowflake;
      role: Role;
    }

    interface IGuildRoleUpdate {
      guildId: Snowflake;
      role: Role;
    }

    interface IGuildRoleDelete {
      guildId: Snowflake;
      roleId: Snowflake;
    }

    interface ITypingStart {
      channelId: Snowflake;
      guildId?: Snowflake;
      userId: Snowflake;
      timestamp: number;
      member?: GuildMember;
    }

    interface IWebhooksUpdate {
      guildId: Snowflake;
      channelId: Snowflake;
    }

    interface IChannelPinsUpdate {
      guildId?: Snowflake;
      channelId: Snowflake;
      lastPinTimestamp?: string;
    }

    interface IVoiceServerUpdate {
      token: string;
      guildId: Snowflake;
      endpoint: string;
    }
  }

  const enum Event {
    CHANNEL_CREATE = "CHANNEL_CREATE",
    CHANNEL_UPDATE = "CHANNEL_UPDATE",
    CHANNEL_DELETE = "CHANNEL_DELETE",
    CHANNEL_PINS_UPDATE = "CHANNEL_PINS_UPDATE",
    GUILD_BAN_ADD = "GUILD_BAN_ADD",
    GUILD_BAN_REMOVE = "GUILD_BAN_REMOVE",
    GUILD_UPDATE = "GUILD_UPDATE",
    GUILD_EMOJIS_UPDATE = "GUILD_EMOJIS_UPDATE",
    GUILD_INTEGRATIONS_UPDATE = "GUILD_INTEGRATIONS_UPDATE",
    GUILD_MEMBER_ADD = "GUILD_MEMBER_ADD",
    GUILD_MEMBER_UPDATE = "GUILD_MEMBER_UPDATE",
    GUILD_MEMBER_REMOVE = "GUILD_MEMBER_REMOVE",
    GUILD_ROLE_CREATE = "GUILD_ROLE_CREATE",
    GUILD_ROLE_UPDATE = "GUILD_ROLE_UPDATE",
    GUILD_ROLE_DELETE = "GUILD_ROLE_DELETE",
    MESSAGE_CREATE = "MESSAGE_CREATE",
    MESSAGE_UPDATE = "MESSAGE_UPDATE",
    MESSAGE_DELETE = "MESSAGE_DELETE",
    MESSAGE_DELETE_BULK = "MESSAGE_DELETE_BULK",
    MESSAGE_REACTION_ADD = "MESSAGE_REACTION_ADD",
    MESSAGE_REACTION_REMOVE = "MESSAGE_REACTION_REMOVE",
    MESSAGE_REACTION_REMOVE_ALL = "MESSAGE_REACTION_REMOVE_ALL",
    // PRESENCE_UPDATE = "PRESENCE_UPDATE",
    TYPING_START = "TYPING_START",
    // USER_UPDATE = "USER_UPDATE",
    // VOICE_STATE_UPDATE = "VOICE_STATE_UPDATE",
    // VOICE_SERVER_UPDATE = "VOICE_SERVER_UPDATE",
    WEBHOOKS_UPDATE = "WEBHOOKS_UPDATE"
  }

  function registerEventHandler(
    event: "MESSAGE_CREATE",
    handler: Event.EventListener<Message>
  ): void;
  function registerEventHandler(
    event: "MESSAGE_UPDATE",
    handler: Event.EventListener<Partial<Message>>
  ): void;
  function registerEventHandler(
    event: "MESSAGE_DELETE",
    handler: Event.EventListener<Event.IMessageDelete>
  ): void;
  function registerEventHandler(
    event: "MESSAGE_DELETE_BULK",
    handler: Event.EventListener<Event.IMessageDeleteBulk>
  ): void;
  function registerEventHandler(
    event: "MESSAGE_REACTION_ADD",
    handler: Event.EventListener<Event.IMessageReactionAdd>
  ): void;
  function registerEventHandler(
    event: "MESSAGE_REACTION_REMOVE",
    handler: Event.EventListener<Event.IMessageReactionRemove>
  ): void;
  function registerEventHandler(
    event: "MESSAGE_REACTION_REMOVE_ALL",
    handler: Event.EventListener<Event.IMessageReactionRemoveAll>
  ): void;
  function registerEventHandler(
    event: "GUILD_MEMBER_ADD",
    handler: Event.EventListener<GuildMember>
  ): void;
  function registerEventHandler(
    event: "GUILD_MEMBER_REMOVE",
    handler: Event.EventListener<Event.IGuildMemberRemove>
  ): void;
  function registerEventHandler(
    event: "GUILD_MEMBER_UPDATE",
    handler: Event.EventListener<Event.IGuildMemberUpdate>
  ): void;
  function registerEventHandler(
    event: "GUILD_BAN_ADD",
    handler: Event.EventListener<Event.IGuildBanAdd>
  ): void;
  function registerEventHandler(
    event: "GUILD_BAN_REMOVE",
    handler: Event.EventListener<Event.IGuildBanRemove>
  ): void;
  function registerEventHandler(
    event: "GUILD_EMOJIS_UPDATE",
    handler: Event.EventListener<Event.IGuildEmojisUpdate>
  ): void;
  function registerEventHandler(
    event: "GUILD_INTEGRATIONS_UPDATE",
    handler: Event.EventListener<Event.IGuildIntegrationsUpdate>
  ): void;
  function registerEventHandler(
    event: "GUILD_ROLE_CREATE",
    handler: Event.EventListener<Event.IGuildRoleCreate>
  ): void;
  function registerEventHandler(
    event: "GUILD_ROLE_UPDATE",
    handler: Event.EventListener<Event.IGuildRoleUpdate>
  ): void;
  function registerEventHandler(
    event: "GUILD_ROLE_DELETE",
    handler: Event.EventListener<Event.IGuildRoleDelete>
  ): void;
  function registerEventHandler(
    event: "CHANNEL_CREATE",
    handler: Event.EventListener<discord.Channel.AnyChannel>
  ): void;
  function registerEventHandler(
    event: "CHANNEL_UPDATE",
    handler: Event.EventListener<discord.Channel.AnyChannel>
  ): void;
  function registerEventHandler(
    event: "CHANNEL_DELETE",
    handler: Event.EventListener<discord.Channel.AnyChannel>
  ): void;
  function registerEventHandler(
    event: "CHANNEL_PINS_UPDATE",
    handler: Event.EventListener<Event.IChannelPinsUpdate>
  ): void;
  function registerEventHandler(
    event: "VOICE_STATE_UPDATE",
    handler: Event.EventListener<VoiceState>
  ): void;
  function registerEventHandler(
    event: "VOICE_SERVER_UPDATE",
    handler: Event.EventListener<Event.IVoiceServerUpdate>
  ): void;
  function registerEventHandler(
    event: "TYPING_START",
    handler: Event.EventListener<Event.ITypingStart>
  ): void;
  function registerEventHandler(
    event: "WEBHOOKS_UPDATE",
    handler: Event.EventListener<Event.IWebhooksUpdate>
  ): void;

  function getUser(userId: discord.Snowflake): Promise<discord.User | null>;
  function getGuild(guildId: discord.Snowflake): Promise<discord.Guild | null>;
  function getChannel(channelId: discord.Snowflake): Promise<discord.Channel.AnyChannel | null>;
}
