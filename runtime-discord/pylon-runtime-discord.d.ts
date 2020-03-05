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
 * Events are executed as they are received from the [Discord Gateway](https://discordapp.com/developers/docs/topics/gateway#commands-and-events).
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

  class ApiError extends Error {
    httpStatus: number;
    httpStatusText: string;
    code: number;
    endpoint: string;
    httpMethod: string;
  }

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

  const enum ImageType {
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

    interface IGetAuditLogsOptions {
      limit?: number;
      before?: Snowflake;
      actionType?: AuditLogEntry.ActionType;
      user?: Snowflake | discord.User | discord.GuildMember;
    }

    type GetAuditLogsOptionsWithActionType<
      T extends discord.AuditLogEntry.ActionType | undefined
    > = Guild.IGetAuditLogsOptions & {
      actionType: T;
    };

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

    const enum Feature {
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

    const enum Region {
      AMSTERDAM = "amsterdam",
      BRAZIL = "brazil",
      DUBAI = "dubai",
      EU_CENTRAL = "eu-central",
      EU_WEST = "eu-west",
      EUROPE = "europe",
      FRANKFURT = "frankfurt",
      HONGKONG = "hongkong",
      INDIA = "india",
      JAPAN = "japan",
      LONDON = "london",
      RUSSIA = "russia",
      SINGAPORE = "singapore",
      SOUTHAFRICA = "southafrica",
      SYDNEY = "sydney",
      US_CENTRAL = "us-central",
      US_EAST = "us-east",
      US_SOUTH = "us-south",
      US_WEST = "us-west",
      VIP_AMSTERDAM = "vip-amsterdam",
      VIP_US_EAST = "vip-us-east",
      VIP_US_WEST = "vip-us-west"
    }

    const enum NotificationsLevel {
      ALL_MESSAGES = 0,
      ONLY_MENTIONS = 1
    }

    const enum ExplicitContentFilterLevel {
      DISABLED = 0,
      MEMBERS_WITHOUT_ROLES = 1,
      ALL_MENTIONS = 2
    }

    const enum MFALevel {
      NONE = 0,
      ELEVATED = 1
    }

    const enum VerificationLevel {
      NONE = 0,
      LOW = 1,
      MEDIUM = 2,
      HIGH = 3,
      VERY_HIGH = 4
    }

    const enum PremiumTier {
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

    /* 
      start audit-log bonanza 
    */

    getAuditLogs(
      options: Guild.GetAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.GUILD_UPDATE>
    ): AsyncIterableIterator<discord.AuditLogEntry.GuildUpdate>;
    getAuditLogs(
      options: Guild.GetAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.CHANNEL_CREATE>
    ): AsyncIterableIterator<discord.AuditLogEntry.ChannelCreate>;
    getAuditLogs(
      options: Guild.GetAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.CHANNEL_UPDATE>
    ): AsyncIterableIterator<discord.AuditLogEntry.ChannelUpdate>;
    getAuditLogs(
      options: Guild.GetAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.CHANNEL_DELETE>
    ): AsyncIterableIterator<discord.AuditLogEntry.ChannelDelete>;
    getAuditLogs(
      options: Guild.GetAuditLogsOptionsWithActionType<
        AuditLogEntry.ActionType.CHANNEL_OVERWRITE_CREATE
      >
    ): AsyncIterableIterator<discord.AuditLogEntry.ChannelPermissionOverwriteCreate>;
    getAuditLogs(
      options: Guild.GetAuditLogsOptionsWithActionType<
        AuditLogEntry.ActionType.CHANNEL_OVERWRITE_UPDATE
      >
    ): AsyncIterableIterator<discord.AuditLogEntry.ChannelPermissionOverwritesUpdate>;
    getAuditLogs(
      options: Guild.GetAuditLogsOptionsWithActionType<
        AuditLogEntry.ActionType.CHANNEL_OVERWRITE_DELETE
      >
    ): AsyncIterableIterator<discord.AuditLogEntry.ChannelPermissionOverwriteDelete>;
    getAuditLogs(
      options: Guild.GetAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.MEMBER_KICK>
    ): AsyncIterableIterator<discord.AuditLogEntry.MemberKick>;
    getAuditLogs(
      options: Guild.GetAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.MEMBER_PRUNE>
    ): AsyncIterableIterator<discord.AuditLogEntry.MemberPrune>;
    getAuditLogs(
      options: Guild.GetAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.MEMBER_BAN_ADD>
    ): AsyncIterableIterator<discord.AuditLogEntry.MemberBanAdd>;
    getAuditLogs(
      options: Guild.GetAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.MEMBER_BAN_REMOVE>
    ): AsyncIterableIterator<discord.AuditLogEntry.MemberBanRemove>;
    getAuditLogs(
      options: Guild.GetAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.MEMBER_UPDATE>
    ): AsyncIterableIterator<discord.AuditLogEntry.MemberUpdate>;
    getAuditLogs(
      options: Guild.GetAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.MEMBER_ROLE_UPDATE>
    ): AsyncIterableIterator<discord.AuditLogEntry.MemberRoleUpdate>;
    getAuditLogs(
      options: Guild.GetAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.MEMBER_MOVE>
    ): AsyncIterableIterator<discord.AuditLogEntry.MemberMove>;
    getAuditLogs(
      options: Guild.GetAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.MEMBER_DISCONNECT>
    ): AsyncIterableIterator<discord.AuditLogEntry.MemberDisconnect>;
    getAuditLogs(
      options: Guild.GetAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.BOT_ADD>
    ): AsyncIterableIterator<discord.AuditLogEntry.BotAdd>;
    getAuditLogs(
      options: Guild.GetAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.ROLE_CREATE>
    ): AsyncIterableIterator<discord.AuditLogEntry.RoleCreate>;
    getAuditLogs(
      options: Guild.GetAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.ROLE_UPDATE>
    ): AsyncIterableIterator<discord.AuditLogEntry.RoleUpdate>;
    getAuditLogs(
      options: Guild.GetAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.ROLE_DELETE>
    ): AsyncIterableIterator<discord.AuditLogEntry.RoleDelete>;
    getAuditLogs(
      options: Guild.GetAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.INVITE_CREATE>
    ): AsyncIterableIterator<discord.AuditLogEntry.InviteCreate>;
    getAuditLogs(
      options: Guild.GetAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.INVITE_UPDATE>
    ): AsyncIterableIterator<discord.AuditLogEntry.InviteUpdate>;
    getAuditLogs(
      options: Guild.GetAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.INVITE_DELETE>
    ): AsyncIterableIterator<discord.AuditLogEntry.InviteDelete>;
    getAuditLogs(
      options: Guild.GetAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.WEBHOOK_CREATE>
    ): AsyncIterableIterator<discord.AuditLogEntry.WebhookCreate>;
    getAuditLogs(
      options: Guild.GetAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.WEBHOOK_UPDATE>
    ): AsyncIterableIterator<discord.AuditLogEntry.WebhookUpdate>;
    getAuditLogs(
      options: Guild.GetAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.WEBHOOK_DELETE>
    ): AsyncIterableIterator<discord.AuditLogEntry.WebhookDelete>;
    getAuditLogs(
      options: Guild.GetAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.EMOJI_CREATE>
    ): AsyncIterableIterator<discord.AuditLogEntry.EmojiCreate>;
    getAuditLogs(
      options: Guild.GetAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.EMOJI_UPDATE>
    ): AsyncIterableIterator<discord.AuditLogEntry.EmojiUpdate>;
    getAuditLogs(
      options: Guild.GetAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.EMOJI_DELETE>
    ): AsyncIterableIterator<discord.AuditLogEntry.EmojiDelete>;
    getAuditLogs(
      options: Guild.GetAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.MESSAGE_DELETE>
    ): AsyncIterableIterator<discord.AuditLogEntry.MessageDelete>;
    getAuditLogs(
      options: Guild.GetAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.MESSAGE_BULK_DELETE>
    ): AsyncIterableIterator<discord.AuditLogEntry.MessageBulkDelete>;
    getAuditLogs(
      options: Guild.GetAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.MESSAGE_PIN>
    ): AsyncIterableIterator<discord.AuditLogEntry.MessagePin>;
    getAuditLogs(
      options: Guild.GetAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.MESSAGE_UNPIN>
    ): AsyncIterableIterator<discord.AuditLogEntry.MessageUnpin>;
    getAuditLogs(
      options: Guild.GetAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.INTEGRATION_CREATE>
    ): AsyncIterableIterator<discord.AuditLogEntry.IntegrationCreate>;
    getAuditLogs(
      options: Guild.GetAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.INTEGRATION_UPDATE>
    ): AsyncIterableIterator<discord.AuditLogEntry.IntegrationUpdate>;
    getAuditLogs(
      options: Guild.GetAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.INTEGRATION_DELETE>
    ): AsyncIterableIterator<discord.AuditLogEntry.IntegrationDelete>;
    getAuditLogs(
      options?: Guild.IGetAuditLogsOptions
    ): AsyncIterableIterator<discord.AuditLogEntry.AnyAction>;

    /* 
      end audit-log bonanza 
    */

    edit(updateData: Guild.IGuildOptions): Promise<Guild>;

    getChannel(channelId: Snowflake): Promise<Channel.AnyGuildChannel | null>;
    createChannel(options: Guild.CreateChannelOptions): Promise<Channel.AnyGuildChannel>;

    createBan(userId: Snowflake, options?: discord.Guild.IGuildBanOptions): Promise<void>;

    getRoles(): Promise<Role[]>;
    getRole(roleId: Snowflake): Promise<Role | null>;

    getMember(userId: Snowflake): Promise<GuildMember | null>;

    getIconUrl(type?: discord.ImageType): string | null;
    getSplashUrl(
      type?: discord.ImageType.PNG | discord.ImageType.JPEG | discord.ImageType.WEBP
    ): string | null;
    getBannerUrl(
      type?: discord.ImageType.PNG | discord.ImageType.JPEG | discord.ImageType.WEBP
    ): string | null;

    voiceDisconnect(): Promise<void>;
  }

  class AuditLogEntry {
    readonly id: Snowflake;
    readonly userId: Snowflake;
    readonly user: discord.User;
    readonly actionType: AuditLogEntry.ActionType;
    readonly reason: string;
    readonly targetId: Snowflake | null;
  }

  namespace AuditLogEntry {
    const enum ActionType {
      GUILD_UPDATE = 1,
      CHANNEL_CREATE = 10,
      CHANNEL_UPDATE = 11,
      CHANNEL_DELETE = 12,
      CHANNEL_OVERWRITE_CREATE = 13,
      CHANNEL_OVERWRITE_UPDATE = 14,
      CHANNEL_OVERWRITE_DELETE = 15,
      MEMBER_KICK = 20,
      MEMBER_PRUNE = 21,
      MEMBER_BAN_ADD = 22,
      MEMBER_BAN_REMOVE = 23,
      MEMBER_UPDATE = 24,
      MEMBER_ROLE_UPDATE = 25,
      MEMBER_MOVE = 26,
      MEMBER_DISCONNECT = 27,
      BOT_ADD = 28,
      ROLE_CREATE = 30,
      ROLE_UPDATE = 31,
      ROLE_DELETE = 32,
      INVITE_CREATE = 40,
      INVITE_UPDATE = 41,
      INVITE_DELETE = 42,
      WEBHOOK_CREATE = 50,
      WEBHOOK_UPDATE = 51,
      WEBHOOK_DELETE = 52,
      EMOJI_CREATE = 60,
      EMOJI_UPDATE = 61,
      EMOJI_DELETE = 62,
      MESSAGE_DELETE = 72,
      MESSAGE_BULK_DELETE = 73,
      MESSAGE_PIN = 74,
      MESSAGE_UNPIN = 75,
      INTEGRATION_CREATE = 80,
      INTEGRATION_UPDATE = 81,
      INTEGRATION_DELETE = 82
    }

    type AnyAction =
      | AuditLogEntry.GuildUpdate
      | AuditLogEntry.ChannelCreate
      | AuditLogEntry.ChannelUpdate
      | AuditLogEntry.ChannelDelete
      | AuditLogEntry.ChannelPermissionOverwriteCreate
      | AuditLogEntry.ChannelPermissionOverwritesUpdate
      | AuditLogEntry.ChannelPermissionOverwriteDelete
      | AuditLogEntry.MemberKick
      | AuditLogEntry.MemberPrune
      | AuditLogEntry.MemberBanAdd
      | AuditLogEntry.MemberBanRemove
      | AuditLogEntry.MemberUpdate
      | AuditLogEntry.MemberRoleUpdate
      | AuditLogEntry.MemberMove
      | AuditLogEntry.MemberDisconnect
      | AuditLogEntry.BotAdd
      | AuditLogEntry.RoleCreate
      | AuditLogEntry.RoleUpdate
      | AuditLogEntry.RoleDelete
      | AuditLogEntry.InviteCreate
      | AuditLogEntry.InviteUpdate
      | AuditLogEntry.InviteDelete
      | AuditLogEntry.WebhookCreate
      | AuditLogEntry.WebhookUpdate
      | AuditLogEntry.WebhookDelete
      | AuditLogEntry.EmojiCreate
      | AuditLogEntry.EmojiUpdate
      | AuditLogEntry.EmojiDelete
      | AuditLogEntry.MessageDelete
      | AuditLogEntry.MessageBulkDelete
      | AuditLogEntry.MessagePin
      | AuditLogEntry.MessageUnpin
      | AuditLogEntry.IntegrationCreate
      | AuditLogEntry.IntegrationUpdate
      | AuditLogEntry.IntegrationDelete;

    interface IActionChange<T> {
      oldValue?: T;
      newValue: T;
    }

    interface IActionChangeNewValue<T> {
      newValue: T;
    }

    interface IActionChangeOldValue<T> {
      oldValue: T;
    }

    class GuildUpdate extends AuditLogEntry {
      readonly targetId: Snowflake;
      readonly actionType: ActionType.GUILD_UPDATE;
      readonly changes: {
        readonly name?: IActionChange<string>;
        readonly iconHash?: IActionChange<string>;
        readonly splashHash?: IActionChange<string>;
        readonly ownerId?: IActionChange<Snowflake>;
        readonly region?: IActionChange<Guild.Region>;
        readonly afkChannelId?: IActionChange<Snowflake>;
        readonly afkTimeout?: IActionChange<number>;
        readonly mfaLevel?: IActionChange<Guild.MFALevel>;
        readonly verificationLevel?: IActionChange<Guild.VerificationLevel>;
        readonly explicitContentFilter?: IActionChange<Guild.ExplicitContentFilterLevel>;
        readonly defaultMessageNotification?: IActionChange<Guild.NotificationsLevel>;
        readonly vanityUrlCode?: IActionChange<string>;
        readonly widgetEnabled?: IActionChange<boolean>;
        readonly widgetChannelId?: IActionChange<Snowflake>;
        readonly systemChannelId?: IActionChange<Snowflake>;
      };
    }

    class ChannelCreate extends AuditLogEntry {
      readonly targetId: Snowflake;
      readonly actionType: ActionType.CHANNEL_CREATE;
      readonly changes: {
        readonly name: IActionChangeNewValue<string>;
        readonly type: IActionChangeNewValue<Channel.Type>;
        readonly topic?: IActionChangeNewValue<string>;
        readonly rateLimitPerUser?: IActionChangeNewValue<number>;
        readonly nsfw?: IActionChangeNewValue<boolean>;
        readonly bitrate?: IActionChangeNewValue<number>;
      };
    }

    class ChannelUpdate extends AuditLogEntry {
      readonly targetId: Snowflake;
      readonly actionType: ActionType.CHANNEL_UPDATE;
      readonly changes: {
        readonly name?: IActionChange<string>;
        readonly topic?: IActionChange<string>;
        readonly rateLimitPerUser?: IActionChange<number>;
        readonly nsfw?: IActionChange<boolean>;
        readonly bitrate?: IActionChange<number>;
      };
    }

    class ChannelDelete extends AuditLogEntry {
      readonly targetId: Snowflake;
      readonly actionType: ActionType.CHANNEL_DELETE;
      readonly changes: {
        readonly name: IActionChangeOldValue<string>;
        readonly type: IActionChangeOldValue<Channel.Type>;
        readonly topic?: IActionChangeOldValue<string>;
        readonly rateLimitPerUser?: IActionChangeOldValue<number>;
        readonly nsfw?: IActionChangeOldValue<boolean>;
        readonly bitrate?: IActionChangeOldValue<number>;
      };
    }

    type ActionChannelPermissionOverwriteUpdateOptions =
      | {
          readonly id: Snowflake;
          readonly type: Channel.PermissionOverwriteType.MEMBER;
        }
      | {
          readonly id: Snowflake;
          readonly type: Channel.PermissionOverwriteType.ROLE;
          readonly roleName: string;
        };

    class ChannelPermissionOverwriteCreate extends AuditLogEntry {
      readonly actionType: ActionType.CHANNEL_OVERWRITE_CREATE;
      readonly changes: {
        readonly id: IActionChangeNewValue<Snowflake>;
        readonly type: IActionChangeNewValue<Channel.PermissionOverwriteType>;
        readonly allow: IActionChangeNewValue<number>;
        readonly deny: IActionChangeNewValue<number>;
      };
      readonly options: ActionChannelPermissionOverwriteUpdateOptions;
    }

    class ChannelPermissionOverwritesUpdate extends AuditLogEntry {
      readonly targetId: Snowflake;
      readonly actionType: ActionType.CHANNEL_OVERWRITE_UPDATE;
      readonly changes: {
        readonly allow?: IActionChange<number>;
        readonly deny?: IActionChange<number>;
      };
      readonly options: ActionChannelPermissionOverwriteUpdateOptions;
    }

    class ChannelPermissionOverwriteDelete extends AuditLogEntry {
      readonly targetId: Snowflake;
      readonly actionType: ActionType.CHANNEL_OVERWRITE_DELETE;
      readonly changes: {
        readonly id: IActionChangeOldValue<Snowflake>;
        readonly type: IActionChangeOldValue<Channel.PermissionOverwriteType>;
        readonly allow: IActionChangeOldValue<number>;
        readonly deny: IActionChangeOldValue<number>;
      };
      readonly options: ActionChannelPermissionOverwriteUpdateOptions;
    }

    class MemberKick extends AuditLogEntry {
      readonly targetId: Snowflake;
      readonly actionType: ActionType.MEMBER_KICK;
      readonly changes: {};
    }

    class MemberPrune extends AuditLogEntry {
      readonly actionType: ActionType.MEMBER_PRUNE;
      readonly changes: {};
      readonly options: {
        readonly deleteMemberDays: string;
        readonly membersRemoved: string;
      };
    }

    class MemberBanAdd extends AuditLogEntry {
      readonly targetId: Snowflake;
      readonly actionType: ActionType.MEMBER_BAN_ADD;
      readonly changes: {};
    }

    class MemberBanRemove extends AuditLogEntry {
      readonly targetId: Snowflake;
      readonly actionType: ActionType.MEMBER_BAN_REMOVE;
      readonly changes: {};
    }

    class MemberUpdate extends AuditLogEntry {
      readonly targetId: Snowflake;
      readonly actionType: ActionType.MEMBER_UPDATE;
      readonly changes: {
        readonly deaf?: IActionChange<boolean>;
        readonly mute?: IActionChange<boolean>;
        readonly nick?: IActionChange<string>;
      };
    }

    class MemberRoleUpdate extends AuditLogEntry {
      readonly targetId: Snowflake;
      readonly actionType: ActionType.MEMBER_ROLE_UPDATE;
      readonly changes: {
        readonly $add?: IActionChangeNewValue<{
          readonly name: string;
          readonly id: Snowflake;
        }>;
        readonly $remove?: IActionChangeNewValue<{
          readonly name: string;
          readonly id: Snowflake;
        }>;
      };
    }

    class MemberMove extends AuditLogEntry {
      readonly targetId: null;
      readonly actionType: ActionType.MEMBER_MOVE;
      readonly changes: {};
      readonly options: {
        readonly channelId: Snowflake;
        readonly count: string;
      };
    }

    class MemberDisconnect extends AuditLogEntry {
      readonly targetId: null;
      readonly actionType: ActionType.MEMBER_DISCONNECT;
      readonly changes: {};
      readonly options: {
        readonly count: string;
      };
    }

    class BotAdd extends AuditLogEntry {
      readonly targetId: Snowflake;
      readonly actionType: ActionType.BOT_ADD;
      readonly changes: {};
    }

    class RoleCreate extends AuditLogEntry {
      readonly targetId: Snowflake;
      readonly actionType: ActionType.ROLE_CREATE;
      readonly changes: {
        readonly name: IActionChangeNewValue<string>;
        readonly color: IActionChangeNewValue<number>;
        readonly hoist: IActionChangeNewValue<boolean>;
        readonly mentionable: IActionChangeNewValue<boolean>;
        readonly permissions: IActionChangeNewValue<number>;
      };
    }

    class RoleUpdate extends AuditLogEntry {
      readonly targetId: Snowflake;
      readonly actionType: ActionType.ROLE_UPDATE;
      readonly changes: {
        readonly name?: IActionChange<string>;
        readonly color?: IActionChange<number>;
        readonly hoist?: IActionChange<boolean>;
        readonly mentionable?: IActionChange<boolean>;
        readonly permissions?: IActionChange<number>;
      };
    }

    class RoleDelete extends AuditLogEntry {
      readonly targetId: Snowflake;
      readonly actionType: ActionType.ROLE_DELETE;
      readonly changes: {
        readonly name: IActionChangeOldValue<string>;
        readonly color: IActionChangeOldValue<number>;
        readonly hoist: IActionChangeOldValue<boolean>;
        readonly mentionable: IActionChangeOldValue<boolean>;
        readonly permissions: IActionChangeOldValue<number>;
      };
    }

    class InviteCreate extends AuditLogEntry {
      readonly targetId: Snowflake;
      readonly actionType: ActionType.INVITE_CREATE;
      readonly changes: {
        readonly code: IActionChangeNewValue<string>;
        readonly channelId: IActionChangeNewValue<Snowflake>;
        readonly inviterId: IActionChangeNewValue<Snowflake>;
        readonly uses: IActionChangeNewValue<number>;
        readonly maxUses: IActionChangeNewValue<number>;
        readonly maxAge: IActionChangeNewValue<number>;
        readonly temporary: IActionChangeNewValue<boolean>;
      };
    }

    class InviteUpdate extends AuditLogEntry {
      readonly targetId: Snowflake;
      readonly actionType: ActionType.INVITE_UPDATE;
      readonly changes: {
        readonly code?: IActionChange<string>;
        readonly channelId?: IActionChange<Snowflake>;
        readonly inviterId?: IActionChange<Snowflake>;
        readonly uses?: IActionChange<number>;
        readonly maxUses?: IActionChange<number>;
        readonly maxAge?: IActionChange<number>;
        readonly temporary?: IActionChange<boolean>;
      };
    }

    class InviteDelete extends AuditLogEntry {
      readonly targetId: Snowflake;
      readonly actionType: ActionType.INVITE_DELETE;
      readonly changes: {
        readonly code: IActionChangeOldValue<string>;
        readonly channelId: IActionChangeOldValue<Snowflake>;
        readonly inviterId: IActionChangeOldValue<Snowflake>;
        readonly uses: IActionChangeOldValue<number>;
        readonly maxUses: IActionChangeOldValue<number>;
        readonly maxAge: IActionChangeOldValue<number>;
        readonly temporary: IActionChangeOldValue<boolean>;
      };
    }

    class WebhookCreate extends AuditLogEntry {
      readonly targetId: Snowflake;
      readonly actionType: ActionType.WEBHOOK_CREATE;
      readonly changes: {
        readonly channelId: IActionChangeNewValue<Snowflake>;
        readonly name: IActionChangeNewValue<string>;
        readonly type: IActionChangeNewValue<number>;
        readonly avatarHash?: IActionChangeNewValue<string>;
      };
    }

    class WebhookUpdate extends AuditLogEntry {
      readonly targetId: Snowflake;
      readonly actionType: ActionType.WEBHOOK_UPDATE;
      readonly changes: {
        readonly channelId?: IActionChange<Snowflake>;
        readonly name?: IActionChange<string>;
        readonly type?: IActionChange<number>;
        readonly avatarHash?: IActionChange<string>;
      };
    }

    class WebhookDelete extends AuditLogEntry {
      readonly targetId: Snowflake;
      readonly actionType: ActionType.WEBHOOK_DELETE;
      readonly changes: {
        readonly channelId: IActionChangeOldValue<Snowflake>;
        readonly name: IActionChangeOldValue<string>;
        readonly type: IActionChangeOldValue<number>;
        readonly avatarHash?: IActionChangeOldValue<string>;
      };
    }

    class EmojiCreate extends AuditLogEntry {
      readonly targetId: Snowflake;
      readonly actionType: ActionType.EMOJI_CREATE;
      readonly changes: {
        readonly name: IActionChangeNewValue<string>;
      };
    }

    class EmojiUpdate extends AuditLogEntry {
      readonly targetId: Snowflake;
      readonly actionType: ActionType.EMOJI_UPDATE;
      readonly changes: {
        readonly name?: IActionChange<string>;
      };
    }

    class EmojiDelete extends AuditLogEntry {
      readonly targetId: Snowflake;
      readonly actionType: ActionType.EMOJI_DELETE;
      readonly changes: {
        readonly name?: IActionChangeOldValue<string>;
      };
    }

    class MessageDelete extends AuditLogEntry {
      readonly targetId: Snowflake;
      readonly actionType: ActionType.MESSAGE_DELETE;
      readonly changes: {};
      readonly options: {
        readonly channelId: string;
        readonly count: string;
      };
    }

    class MessageBulkDelete extends AuditLogEntry {
      readonly targetId: Snowflake;
      readonly actionType: ActionType.MESSAGE_BULK_DELETE;
      readonly changes: {};
      readonly options: {
        readonly count: string;
      };
    }

    class MessagePin extends AuditLogEntry {
      readonly targetId: Snowflake;
      readonly actionType: ActionType.MESSAGE_PIN;
      readonly changes: {};
      readonly options: {
        readonly channelId: Snowflake;
        readonly messageId: Snowflake;
      };
    }

    class MessageUnpin extends AuditLogEntry {
      readonly targetId: Snowflake;
      readonly actionType: ActionType.MESSAGE_UNPIN;
      readonly changes: {};
      readonly options: {
        readonly channelId: Snowflake;
        readonly messageId: Snowflake;
      };
    }

    class IntegrationCreate extends AuditLogEntry {
      readonly targetId: Snowflake;
      readonly actionType: ActionType.INTEGRATION_CREATE;
      readonly changes: {
        readonly name: IActionChangeNewValue<string>;
        readonly type: IActionChangeNewValue<"twitch" | "youtube">;
        readonly expireBehavior: IActionChangeNewValue<number>;
        readonly expireGracePeriod: IActionChangeNewValue<number>;
        readonly enableEmoticons?: IActionChangeNewValue<boolean>;
      };
    }

    class IntegrationUpdate extends AuditLogEntry {
      readonly targetId: Snowflake;
      readonly actionType: ActionType.INTEGRATION_UPDATE;
      readonly changes: {
        readonly name?: IActionChange<string>;
        readonly type?: IActionChange<"twitch" | "youtube">;
        readonly expireBehavior?: IActionChange<number>;
        readonly expireGracePeriod?: IActionChange<number>;
        readonly enableEmoticons?: IActionChange<boolean>;
      };
    }

    class IntegrationDelete extends AuditLogEntry {
      readonly targetId: Snowflake;
      readonly actionType: ActionType.INTEGRATION_DELETE;
      readonly changes: {
        readonly name: IActionChangeOldValue<string>;
        readonly type: IActionChangeOldValue<"twitch" | "youtube">;
        readonly expireBehavior: IActionChangeOldValue<number>;
        readonly expireGracePeriod: IActionChangeOldValue<number>;
        readonly enableEmoticons?: IActionChangeOldValue<boolean>;
      };
    }
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

    voiceConnect(): Promise<void>;
  }

  /* GuildCategory */

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

    const enum Type {
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
      content?: string;
      tts?: boolean;
      embed?: Embed | Embed.IEmbed;
      allowedMentions?: IAllowedMentions;
    }

    type OutgoingMessageOptions = IOutgoingMessageOptions &
      (
        | { content: string; embed?: Embed | Embed.IEmbed }
        | { content?: string; embed: Embed | Embed.IEmbed }
      );

    interface IAllowedMentions {
      everyone?: boolean;
      roles?: true | Array<Snowflake | Role>;
      users?: true | Array<Snowflake | User | GuildMember>;
    }

    type OutgoingMessage = string | OutgoingMessageOptions | Embed;
  }

  class Message {
    readonly id: Snowflake;
    readonly channelId: Snowflake;
    readonly guildId: Snowflake | null;
    readonly content: string;
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

    getChannel(): Promise<
      discord.DmChannel | (discord.GuildTextChannel | discord.GuildNewsChannel)
    >;
    getGuild(): Promise<Guild | null>;

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

  class GuildMemberMessage extends Message {
    // non-null when we get a message from a user in a guild channel
    readonly guildId: Snowflake;
    readonly author: User;
    readonly member: GuildMember;
    readonly webhookId: null;

    // no special message type for these
    readonly type: Message.Type.DEFAULT;

    // this will always be null
    readonly messageReference: null;

    getGuild(): Promise<discord.Guild>;
    getChannel(): Promise<discord.GuildTextChannel | discord.GuildNewsChannel>;
  }

  class VoiceState {
    guildId: Snowflake;
    channelId: Snowflake | null;
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
    type EventListener<T> = (evt: T) => Promise<unknown>;

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
      member?: GuildMember;
      emoji: Partial<Emoji>;
    }

    interface IMessageReactionRemove {
      userId: Snowflake;
      channelId: Snowflake;
      messageId: Snowflake;
      guildId?: Snowflake;
      member?: GuildMember;
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
    VOICE_STATE_UPDATE = "VOICE_STATE_UPDATE",
    VOICE_SERVER_UPDATE = "VOICE_SERVER_UPDATE",
    WEBHOOKS_UPDATE = "WEBHOOKS_UPDATE"
  }

  function registerEventHandler(
    event: "MESSAGE_CREATE",
    handler: Event.EventListener<Message | GuildMemberMessage>
  ): void;
  function registerEventHandler(
    event: "MESSAGE_UPDATE",
    handler: Event.EventListener<Partial<Message | GuildMemberMessage>>
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

  // alias for registerEventHandler
  const on: typeof registerEventHandler;

  function getUser(userId: discord.Snowflake): Promise<discord.User | null>;
  function getBotId(): discord.Snowflake;
  function getBotUser(): Promise<discord.User>;
  function getGuild(guildId: discord.Snowflake): Promise<discord.Guild | null>;
  function getChannel(channelId: discord.Snowflake): Promise<discord.Channel.AnyChannel | null>;

  namespace command {
    enum ValidationErrorType {
      REQUIRES_GUILD,
      MISSING_ROLE,
      WRONG_CHANNEL
    }

    class ValidationError extends Error {
      public type: ValidationErrorType;

      constructor(type: ValidationErrorType, message?: string);
    }

    class ArgumentError extends Error {
      public argumentName: string;

      constructor(message: string);
    }

    class Command {
      getHelpString(): string;
      getCommandPrefix(): string;
    }

    interface IArgOptions<T> {
      name?: string;
      description?: string;
    }

    interface IOptionalArgOptions<T> extends IArgOptions<T> {
      /**
       * Optional arguments allow you to specify a default.
       * Otherwise, a missing optional argument will resolve as null.
       */
      default?: T;
    }

    interface IUserArgOptions extends IArgOptions<discord.User> {}

    interface ICommandArgs {
      /**
       * Parses a single space-delimited argument as a string.
       * @param options argument config
       */
      string(options?: IArgOptions<string>): string;

      /**
       * Optionally parses a single space-delimited argument as a string.
       * @param options argument config
       */
      stringOptional(options?: IOptionalArgOptions<string>): string | null;

      /**
       * Parses a single space-delimited argument with parseInt()
       * Non-numeric inputs will cause the command to error. Floating point inputs are truncated.
       * @param options argument config
       */
      integer(options?: IArgOptions<number>): number;
      /**
       * Optionally parses a single space-delimited argument with parseInt()
       * Non-numeric inputs will cause the command to error. Floating point inputs are truncated.
       * @param options argument config
       */
      integerOptional(options?: IOptionalArgOptions<number>): number | null;

      /**
       * Parses a single space-delimited argument with parseFloat()
       * Non-numeric inputs will cause the command to error.
       * @param options argument config
       */
      number(options?: IArgOptions<number>): number;
      /**
       * Optionally parses a single space-delimited argument with parseFloat()
       * Non-numeric inputs will cause the command to error.
       * @param options argument config
       */
      numberOptional(options?: IOptionalArgOptions<number>): number | null;

      /**
       * Parses the rest of the command's input as a string, leaving no more content for any future arguments.
       * If used, this argument must appear as the last argument in your command handler.
       * @param options argument config
       */
      text(options?: IArgOptions<string>): string;
      /**
       * Optionally parses the rest of the command's input as a string, leaving no more content for any future arguments.
       * If used, this argument must appear as the last argument in your command handler.
       * @param options argument config
       */
      textOptional(options?: IOptionalArgOptions<string>): string | null;

      /**
       * Parses the rest of the command's input as space-delimited string values.
       * If used, this argument must appear as the last argument in your command handler.
       * @param options argument config
       */
      stringList(options?: IArgOptions<string[]>): string[];
      /**
       * Optionally parses the rest of the command's input as space-delimited string values.
       * If used, this argument must appear as the last argument in your command handler.
       * @param options argument config
       */
      stringListOptional(options?: IOptionalArgOptions<string[]>): string[] | null;

      /**
       * Parses a mention string or user id and resolves a [[discord.User]] object reference.
       * If the user was not found, the command will error.
       * @param options argument config
       */
      user(options?: IArgOptions<discord.User>): Promise<discord.User>;

      /**
       * Optionally parses a mention string or user id and resolves a [[discord.User]] object reference.
       * If the argument is present but the user was not found, the command will error.
       * Like all optional arguments, if the argument is not present the value will be resolved as null.
       * @param options argument config
       */
      userOptional(
        options?: IOptionalArgOptions<discord.User | null>
      ): Promise<discord.User | null>;

      /**
       * Parses a mention string or user id and resolves a [[discord.GuildMember]] object reference.
       * If the member was not found, the command will error.
       * The command will error if it was not used in a guild.
       * @param options argument config
       */
      guildMember(options?: IArgOptions<discord.GuildMember>): Promise<discord.GuildMember>;
      /**
       * Optionally parses a mention string or user id and resolves a [[discord.GuildMember]] object reference.
       * If the argument is present but the member was not found, the command will error.
       * Like all optional arguments, if the argument is not present the value will be resolved as null.
       * @param options argument config
       */
      guildMemberOptional(
        options?: IOptionalArgOptions<discord.GuildMember | null>
      ): Promise<discord.GuildMember | null>;
    }

    interface ICommandOptions {
      name: string;
      description?: string;
      commandPrefix?: string;
      onError?: (ctx: ICommandContext, e: Error) => void | Promise<void>;
    }

    interface ICommandContext {
      /**
       * The command being run.
       */
      command: Command;

      /**
       * The message sent that triggered this command.
       */
      message: discord.GuildMemberMessage;

      /**
       * The command being run.
       * @deprecated Use the "command" property instead!
       */
      cmd: Command;

      /**
       * The message sent that triggered this command.
       * @deprecated Use the "message" property instead!
       */
      msg: discord.GuildMemberMessage;
    }

    type CommandArgumentTypes =
      | string
      | string[]
      | number
      | Promise<discord.User>
      | Promise<discord.User | null>
      | Promise<discord.GuildMember>
      | Promise<discord.GuildMember | null>
      | null;

    type CommandArgumentsContainer = { [key: string]: CommandArgumentTypes } | null;
    type ArgumentsParser<T extends CommandArgumentsContainer> = (args: ICommandArgs) => T;
    type CommandHandler<T> = (ctx: ICommandContext, args: T) => Promise<void>;

    interface ICommandGroupOptions {
      defaultPrefix?: string;
    }

    type ResolvedArgs<T extends CommandArgumentsContainer> = {
      [P in keyof T]: T[P] extends Promise<infer R> ? R : T[P];
    };

    class CommandGroup {
      constructor(options?: ICommandGroupOptions);

      registerCommand<T extends CommandArgumentsContainer>(
        options: string | ICommandOptions,
        parser: ArgumentsParser<T>,
        handler: CommandHandler<ResolvedArgs<T>>
      ): this;
      registerCommand(options: string | ICommandOptions, handler: CommandHandler<null>): this;

      getCommandPrefix(): string;
    }
  }
}
