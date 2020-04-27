/**
 * # Discord SDK
 *
 * The `discord` module is exposed on the global scope within the Pylon runtime.
 *
 * **See [the Discord SDK](https://pylon.bot/docs/discord-general) section of our Documentation site for an in-depth walk-through of our Discord SDK!**
 *
 * ### Event-Based Runtime
 * Events are executed as they are received from the [Discord Gateway](https://discordapp.com/developers/docs/topics/gateway#commands-and-events).
 * You can register event handlers within the Pylon runtime to act upon new messages, guild members, reactions, and much more.
 * Event handlers are expected to be Promises, which may kick off or await additional async tasks.
 *
 * See [[discord.on]] for a list of events and their respective payloads.
 *
 * ### Fetching Data
 * Pylon keeps an in-memory cache of Discord-related objects (guilds, members, channels, messages, etc) to reduce the amount of external calls made to the Discord API when requesting data.
 * As events are received from the gateway, this cache is updated to reflect the latest state-of-the-world at all times.
 *
 * Most data objects in the Discord SDK have a handful of async functions to fetch data on related objects.
 * If an object is not found, `null` is typically returned.
 *
 * #### Example: A simple `!test` command that fetches and returns miscellaneous data.
 * ```ts
 * const commands = new discord.command.CommandGroup({
 *   defaultPrefix: '!'
 * });
 *
 * commands.raw('test', async (message) => {
 * // Get the author of the message
 * const user = message.author;
 *
 * // Fetch the guild this message was sent in
 * const guild = await message.getGuild();
 *
 *  // Get the channel the message was sent in, note the 'await' keyword
 *  const channel = await message.getChannel();
 *
 *  // Fetch role data from the guild for all the roles the user has assigned
 *  const roles = await Promise.all(
 *    message.member.roles.map((roleId) => guild.getRole(roleId))
 *  );
 *
 *  // Construct a list of role names, separated by new lines
 *  const roleNames = roles
 *    .map((role) => {
 *      if (!role) return;
 *      return ` - ${role.name}`;
 *    })
 *    .join('\n');
 *
 *  // Reply with some data we found
 *  await message.reply(
 *    `You are ${user.toMention()} sending a message in ${channel.toMention()}. You have the following roles:\n${roleNames}`
 *  );
 *});
 *
 * ```
 *
 * ### Making Discord API requests
 * Pylon abstracts API requests into simple functions on data objects, you cannot make Discord API requests directly.
 * If a request is rate-limited, it will delay promise resolution until it is able to execute.
 *
 * ```ts
 * const COOL_ROLE_ID = '421726263504229715';
 * discord.on('MESSAGE_CREATE', async (message) => {
 *   // We only care about messages sent in a guild by users
 *   if (!(message instanceof discord.GuildMemberMessage)) {
 *     return;
 *   }
 *
 *   // A very !cool command.
 *   if (message.content !== "!cool") {
 *     return;
 *   }
 *
 *   // Do some things with the member
 *   await message.member.addRole(COOL_ROLE_ID);
 *   await message.member.edit({ nick: "Mr. Cool" });
 *
 *   // Respond
 *   await message.reply("You are now Mr. Cool!");
 * })
 * ```
 */

declare module discord {
  /**
   * Unique identifiers assigned to most Discord objects. You can read more about Snowflakes and how Discord uses them on the [Discord docs](https://discordapp.com/developers/docs/reference#snowflakes).
   *
   * You can copy IDs directly from the Discord app if you have [Developer Mode enabled](https://support.discordapp.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID-).
   *
   * Example: Fetching channel data with a Channel ID (snowflake) manually.
   * ```ts
   * const someChannel = await discord.getChannel("640648987937865738");
   * ```
   */
  type Snowflake = string;

  /**
   * Represents an error returned by the Discord API when making certain requests.
   */
  class ApiError extends Error {
    /**
     * The HTTP status code returned by the Discord API. Please see Discord's docs on [HTTP status codes](https://discordapp.com/developers/docs/topics/opcodes-and-status-codes#http) for more information.
     */
    httpStatus: number;
    /**
     * The HTTP status text returned by the Discord API.
     */
    httpStatusText: string;
    /**
     * The error code returned by the API. Please see Discord's docs on [JSON error codes](https://discordapp.com/developers/docs/topics/opcodes-and-status-codes#json) for more information.
     */
    code: number;
    /**
     * The URL suffix used when making the request to the Discord API.
     */
    endpoint: string;
    /**
     * The HTTP Method (GET, POST, etc) used when making the request to the Discord API.
     */
    httpMethod: string;
  }

  /**
   * To be implemented where an object can be represented by Discord mention string.
   *
   * To see how Discord encodes user, member, channel, role, and emojis see [Message Formatting](https://discordapp.com/developers/docs/reference#message-formatting) section of the Discord API docs.
   */
  interface IMentionable {
    /**
     * Returns a mention string or encoded message for the object this function is implemented on.
     *
     * To see how Discord encodes user, member, channel, role, and emojis see [Message Formatting](https://discordapp.com/developers/docs/reference#message-formatting) section of the Discord API docs.
     */
    toMention(): string;
  }

  class User implements IMentionable {
    /**
     * The user's unique Discord id. This field never changes.
     */
    readonly id: Snowflake;
    /**
     * The user's username. This can be changed by the user at any time.
     *
     * Example: Given the user "Somebody#0001", "Somebody" is the username.
     */
    readonly username: string;
    /**
     * The user's 4-digit user suffix. It appears after the username on a user's profile page and is needed to send friend requests.
     *
     * Example: Given the user "Somebody#0001", "Somebody" is the username.
     */
    readonly discriminator: string;
    /**
     * A hash of the user's current avatar.
     *
     * Note: Use [[discord.User.getAvatarUrl]] to retrieve a URL for the avatar.
     */
    readonly avatar: string | null;
    /**
     * Will be `true` if the user is a bot user.
     */
    readonly bot: boolean;

    /**
     * Used to return a URL to user's avatar image.
     *
     * For animated avatars, it will be a GIF. Otherwise, it will return a PNG.
     *
     * If a user's avatar hash is null, it returns a URL to the generic logo-style avatar.
     *
     * @param type Specifying the type will force the image to be returned as the specified format.
     */
    getAvatarUrl(type?: discord.ImageType): string;

    /**
     * Returns a string containing the username and discriminator.
     *
     * For example, `Someone#0001`
     */
    getTag(): string;

    /**
     * Returns a mention string in the format of `<@id>` where id is the id of this user.
     */
    toMention(): string;
  }

  /**
   * Used to specify image types for [[discord.User.getAvatarUrl]], and various images available on a [[discord.Guild]].
   */
  const enum ImageType {
    PNG = "png",
    JPEG = "jpeg",
    WEBP = "webp",
    GIF = "gif",
  }

  namespace Guild {
    /**
     * Options for [[discord.Guild.edit]], requires [[discord.Permission.MANAGE_GUILD]] to modify options.
     */
    interface IGuildOptions {
      /**
       * Sets the name of the guild.
       */
      name?: string;
      /**
       * Sets the voice region this guild should use for voice channels.
       *
       * See [[discord.Guild.Region]] for a list of possible options.
       */
      region?: Guild.Region;
      /**
       * Sets the verification level for this guild. Applies to members without any roles.
       *
       * See [[discord.Guild.VerificationLevel]] for a list of possible options.
       */
      verificationLevel?: discord.Guild.VerificationLevel;
      /**
       * Sets what new members' default notification settings should be.
       *
       * See [[discord.Guild.NotificationsLevel]] for a list of possible options.
       */
      defaultMessageNotifications?: discord.Guild.NotificationsLevel;
      /**
       * Sets the level of content scanning Discord should perform on images sent by members.
       *
       * See [[discord.Guild.ExplicitContentFilterLevel]] for a list of possible options.
       */
      explicitContentFilter?: discord.Guild.ExplicitContentFilterLevel;
      /**
       * Sets the id of a [[discord.GuildVoiceChannel]] to send users to after being idle for longer than [[discord.Guild.afkTimeout]].
       *
       * If null, the AFK timeout is disabled.
       */
      afkChannelId?: Snowflake | null;
      /**
       * Sets the amount of time (in seconds) until users idle in voice channels are moved to the AFK channel, if set.
       *
       * Note: To enable/disable AFK channel timeouts, set [[afkChannelId]] to a valid [[discord.GuildVoiceChannel]]'s id.
       */
      afkTimeout?: number;
      /**
       * Sets a new guild icon. Must be Base64 encoded image data.
       *
       * If null, the icon is removed.
       */
      icon?: string | null;
      /**
       * The id of a user to transfer this guild to. Typically, bots will not be the owner of a guild.
       */
      ownerId?: Snowflake;
      /**
       * Sets a new guild invite page background/splash image. Requires the [[discord.Guild.Feature.INVITE_SPLASH]] feature on the guild.
       *
       * If null, the invite background splash image is removed.
       */
      splash?: string | null;
      /**
       * Sets a new guild invite page background. Requires the [[discord.Guild.Feature.BANNER]] feature on the guild.
       *
       * Must be Base64 encoded image data.
       *
       * If null, the banner is removed.
       */
      banner?: string | null;
      /**
       * Sets the id of the [[discord.GuildTextChannel]] to send welcome messages and server boost messages to.
       *
       * If null, the feature is disabled.
       */
      systemChannelId?: Snowflake | null;
    }

    /**
     * A set of options to use when requesting members with [[discord.Guild.getMembers]].
     */
    interface IGetMembersOptions {
      /**
       * The maximum amount of members to return.
       *
       * Setting this to a 0/undefined value will return all the members.
       */
      limit?: number;
      /**
       * The user id (or time, encoded as a snowflake) to start the scan from. Results from [[discord.Guild.getMembers]] are returned by id in ascending order.
       */
      after?: Snowflake;
    }

    /**
     * A set of options to use when requesting members with [[discord.Guild.getAuditLogs]].
     */
    interface IGetAuditLogsOptions {
      /**
       * The maximum amount of entries to return with this call.
       *
       * Note: If the requested limit is greater than 500, the function will throw an exception.
       */
      limit?: number;
      /**
       * The audit log entry id (or time, encoded as a snowflake) to start the scan from.
       *
       * Results from [[discord.Guild.getAuditLogs]] are returned by id in descending order (by time).
       */
      before?: Snowflake;
      /**
       * The type of [[discord.AuditLogEntry.ActionType]] to filter the results by.
       *
       * If not specified, the request will return all action types.
       */
      actionType?: AuditLogEntry.ActionType;
      /**
       * The user id of a [[discord.User]] to filter by.
       *
       * Results will only be returned if they were performed by the user with the id set.
       */
      user?: Snowflake | discord.User | discord.GuildMember;
    }

    type GetAuditLogsOptionsWithActionType<
      T extends discord.AuditLogEntry.ActionType | undefined
    > = Guild.IGetAuditLogsOptions & {
      actionType: T;
    };

    /**
     * Options you can pass to [[discord.Guild.createChannel]].
     */
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

    /**
     * Options you can pass to [[discord.GuildMember.ban]].
     */
    interface IGuildBanOptions {
      /**
       * How many days of messages sent by this user to delete.
       *
       * Defaults to 0 (no messages deleted), but can go up to 7.
       */
      deleteMessageDays?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
      /**
       * A ban reason, displayed in the Audit Log.
       */
      reason?: string;
    }

    /**
     * Feature flags conditionally set on a [[discord.Guild]]
     *
     * Flags are set when guilds have special features enabled, they cannot be changed.
     */
    const enum Feature {
      /**
       * A feature that enables the guild to set a invite background/splash image ([[discord.Guild.splash]]).
       */
      INVITE_SPLASH = "INVITE_SPLASH",
      /**
       * A feature that (used to) grant access to an extended set of [[discord.Guild.Region]] regions.
       *
       * Note: This flag is defunct, as VIP regions have been removed.
       */
      VIP_REGIONS = "VIP_REGIONS",
      /**
       * A feature that allows the guild to set a custom vanity invite code ([[discord.Guild.vanityUrlCode]]).
       */
      VANITY_URL = "VANITY_URL",
      /**
       * A feature flag set if the Discord server is [verified](https://discordapp.com/verification).
       */
      VERIFIED = "VERIFIED",
      /**
       * A feature flag set if the guild is owned by a [partner](https://discordapp.com/partners).
       */
      PARTNERED = "PARTNERED",
      /**
       * A feature flag set if the guild is considered a public guild. Public guilds can set the following properties on a guild:
       * - [[discord.Guild.preferredLocale]]
       * - [[discord.Guild.description]]
       */
      PUBLIC = "PUBLIC",
      /**
       * A feature flag that enables store channels on the guild.
       */
      COMMERCE = "COMMERCE",
      /**
       * A feature flag that enables announcements channels on the guild.
       */
      NEWS = "NEWS",
      /**
       * A feature flag that elects a guild to be shown on the "Server Discovery" page of Discord.
       */
      DISCOVERABLE = "DISCOVERABLE",
      /**
       * A feature flag that (presumably) allows the guild to be featured around the Discord client.
       */
      FEATURABLE = "FEATURABLE",
      /**
       * A feature flag that allows the [[discord.Guild.icon]] to be an animated gif.
       */
      ANIMATED_ICON = "ANIMATED_ICON",
      /**
       * A feature flag that enables a banner ([[discord.Guild.banner]]) to be displayed over the channel list in your guild.
       */
      BANNER = "BANNER",
    }

    /**
     * An enumeration of voice server regions. See [[discord.Guild.region]].
     */
    const enum Region {
      BRAZIL = "brazil",
      EU_CENTRAL = "eu-central",
      EU_WEST = "eu-west",
      EUROPE = "europe",
      HONGKONG = "hongkong",
      INDIA = "india",
      JAPAN = "japan",
      RUSSIA = "russia",
      SINGAPORE = "singapore",
      SOUTHAFRICA = "southafrica",
      SYDNEY = "sydney",
      SOUTH_KOREA = "south-korea",
      US_CENTRAL = "us-central",
      US_EAST = "us-east",
      US_SOUTH = "us-south",
      US_WEST = "us-west",
    }

    /**
     * The level of notifications new guild members will receive by default.
     */
    const enum NotificationsLevel {
      /**
       * The user will receive a desktop/mobile notification when any message is sent in channels this user has access to.
       */
      ALL_MESSAGES = 0,
      /**
       * The user will only receive desktop/mobile notifications when they are mentioned.
       */
      ONLY_MENTIONS = 1,
    }

    /**
     * A setting that determines the level of explicit content scanning that occurs on this guild.
     *
     * Content filtering only applies to images sent in a guild.
     */
    const enum ExplicitContentFilterLevel {
      /**
       * No explicit content scanning will take place in this guild.
       */
      DISABLED = 0,
      /**
       * Media sent by members without roles will be scanned for explicit content.
       */
      MEMBERS_WITHOUT_ROLES = 1,
      /**
       * Media sent by all members of this guild will be scanned for explicit content.
       */
      ALL_MEMBERS = 2,
    }

    /**
     * An enumeration of possible multi-factor-authentication levels required to use elevated [[discord.Permissions]].
     */
    const enum MFALevel {
      /**
       * 2FA/MFA is NOT required to perform administrative/moderator actions.
       */
      NONE = 0,
      /**
       * 2FA/MFA is required to perform administrative/moderator actions.
       */
      ELEVATED = 1,
    }

    /**
     * An enumeration of possible verification  levels a guild can set.
     */
    const enum VerificationLevel {
      /**
       * Unrestricted
       */
      NONE = 0,
      /**
       * Guild members must have a verified email on their Discord account.
       */
      LOW = 1,
      /**
       * Guild members must have a verified email, AND be registered on Discord for longer than 5 minutes.
       */
      MEDIUM = 2,
      /**
       * Guild members must have a verified email, AND be registered on Discord for longer than 10 minutes.
       */
      HIGH = 3,
      /**
       * Guild members must have a verified email, AND be registered on Discord for longer than 10 minutes, AND have a verified phone number associated with their account.
       */
      VERY_HIGH = 4,
    }

    /**
     * An enumeration of server boost tiers guilds can achieve via server boosting.
     */
    const enum PremiumTier {
      /**
       * The guild hasn't reached Level 1 yet.
       */
      NONE = 0,
      /**
       * The guild is boosted to Level 1.
       */
      TIER_1 = 1,
      /**
       * The guild is boosted to Level 2.
       */
      TIER_2 = 2,
      /**
       * The guild is boosted to Level 3.
       */
      TIER_3 = 3,
    }
  }

  /**
   * A Guild (aka Discord Server) contains basic guild identifiers, basic guild settings, and accessors to objects related to this guild.
   *
   * A guild can be found by id with [[discord.getGuild]], but you can usually access it from most objects related to a guild.
   *
   * For example, [[discord.Message.getGuild]], [[discord.GuildChannel.getGuild]], and [[discord.GuildMember.getGuild]] are ways you can access a guild from related objects.
   */
  class Guild {
    /**
     * The guild's unique Discord id. This field never changes.
     */
    readonly id: Snowflake;
    /**
     * The name of the guild.
     */
    readonly name: string;
    /**
     * The voice region this server is set to use.
     */
    readonly region: discord.Guild.Region;
    /**
     * The level of verification this guild requires to send messages.
     */
    readonly verificationLevel: discord.Guild.VerificationLevel;
    /**
     * The default level of notifications new guild members will receive.
     *
     * Guild members can override this setting individually.
     */
    readonly defaultMessageNotifications: discord.Guild.NotificationsLevel;
    /**
     * The level of explicit image filtering that will occur on this guild.
     */
    readonly explicitContentFilter: discord.Guild.ExplicitContentFilterLevel;
    /**
     * The [[discord.GuildVoiceChannel]]'s that determines what channel to send idle guild members to after the specified [[discord.Guild.afkTimeout]].
     */
    readonly afkChannelId: Snowflake | null;
    /**
     * After a guild member in a voice channel is idle for this amount of time (in seconds), they will be moved to the [[discord.GuildVoiceChannel]] determined in [[discord.Guild.afkChannelId]] (if set).
     */
    readonly afkTimeout: number;
    /**
     * If not null, holds a hash of the guild icon image.
     *
     * Use [[discord.Guild.getIconUrl]] to build a full URL for the guild icon.
     */
    readonly icon: string | null;
    /**
     * The user id that owns this guild.
     */
    readonly ownerId: Snowflake;
    /**
     * If not null, holds a hash of the guild splash image hash.
     *
     * The splash image appears as the background of guild invite pages for this guild.
     *
     * Use [[discord.Guild.getSplashUrl]] to build a full URL for the guild splash image.
     *
     * Note: Requires the [[discord.Guild.Feature.INVITE_SPLASH]] flag in [[discord.Guild.features]] to be set.
     */
    readonly splash: string | null;
    /**
     * If not null, holds a hash of the guild banner image.
     *
     * The banner typically image appears above the guild channel list.
     *
     * Use [[discord.Guild.getBannerUrl]] to build a full URL for the guild banner image.
     *
     * Note: Requires the [[discord.Guild.Feature.BANNER]] flag in [[discord.Guild.features]] to be set.
     */
    readonly banner: string | null;
    /**
     * If not null, determines the channel in which receives guild member join and server boot announcements.
     */
    readonly systemChannelId: Snowflake | null;
    /**
     * The permissions the bot has on the guild.
     */
    readonly permissions?: number;
    /**
     * A list of [[discord.Guild.Feature]]s available to this guild.
     */
    readonly features: Array<Guild.Feature>;
    /**
     * The MFA level required to perform actions guarded by elevated [[discord.Permissions]].
     */
    readonly mfaLevel: number;
    /**
     * The application id tied to this guild. Typically set on Discord guilds with commerce features enabled.
     */
    readonly applicationId: Snowflake | null;
    /**
     * `true` if the guild widget is enabled.
     */
    readonly widgetEnabled: boolean;
    /**
     * If [[discord.Guild.widgetEnabled]] is `true`, defines the channel users invited by the widget will see on join.
     */
    readonly widgetChannelId: Snowflake | null;
    /**
     * The maximum amount of concurrent online users before this guild goes unavailable.
     *
     * Generally increases as [[discord.Guild.memberCount]] increases.
     */
    readonly maxPresences: number;
    /**
     * The number of guild members who joined the guild.
     */
    readonly memberCount: number;
    /**
     * If set, the vanity invite code set on this guild. Requires the [[discord.Guild.Feature.VANITY_URL]] feature flag.
     */
    readonly vanityUrlCode: string | null;
    /**
     * If set, a user-submitted description of the guild. Requires the [[discord.Guild.Feature.PUBLIC]] feature flag.
     */
    readonly description: string | null;
    /**
     * The current tier this guild has. Dependent on the amount of [[discord.Guild.premiumSubscriptionCount]].
     */
    readonly premiumTier: Guild.PremiumTier | null;
    /**
     * The number of boosts this server has.
     */
    readonly premiumSubscriptionCount: number;
    /**
     * The preferred locale of the guild.
     */
    readonly preferredLocale: string;

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

    /**
     * Modifies guild settings. Requires the [[discord.Permissions.MANAGE_GUILD]] permission.
     *
     * #### Example: Set the guild's name to "New Guild Name".
     * ```ts
     * await guild.edit({
     *   name: "New Guild Name"
     * });
     * ```
     *
     * @param updateData The settings to change for this guild.
     * @returns A promise that resolves as the updated guild if successful.
     */
    edit(updateData: Guild.IGuildOptions): Promise<Guild>;

    /**
     * Fetches a list of all channels on this guild.
     */
    getChannels(): Promise<Channel.AnyGuildChannel[]>;

    /**
     * Fetches a single channel from the guild, by id.
     *
     * @param channelId The channel id of the channel you want to fetch
     * @returns An instance of the channel if available, otherwise `null`.
     */
    getChannel(channelId: Snowflake): Promise<Channel.AnyGuildChannel | null>;

    /**
     * Creates a channel on the guild. Requires the [[discord.Permissions.MANAGE_CHANNELS]] permissions.
     *
     * @param options Options for the new channel. Some are optional.
     */
    createChannel(options: Guild.CreateChannelOptions): Promise<Channel.AnyGuildChannel>;

    /**
     * Bans a specific user from the guild.
     *
     * Note: The user does not have to be a member of the guild to ban them.
     *
     * @param user The user id or user-like object to ban.
     * @param options Options for the ban. All values are optional.
     */
    createBan(
      user: Snowflake | User | GuildMember,
      options?: discord.Guild.IGuildBanOptions
    ): Promise<void>;

    /**
     * Un-bans or otherwise removes a ban for a specific user from the guild.
     *
     * @param user The user id or user-like object to un-ban.
     */
    deleteBan(user: Snowflake | User | GuildMember): Promise<void>;

    /**
     * Fetches an array of all the roles on this guild.
     */
    getRoles(): Promise<Role[]>;

    /**
     * Fetches a single role from the guild, by id.
     *
     * @param roleId The id of the role you wish to fetch.
     */
    getRole(roleId: Snowflake): Promise<Role | null>;

    /**
     * Returns an async iterable for the list of members on this guild.
     *
     * The runtime will stream members in chunks and yield individual [[discord.GuildMember]] instances as they become available. Iteration happens on an ascending basis, sorted by user id.
     *
     * Keep in mind this can be a particularly expensive operation to call depending on the amount of guild members are in the guild.
     *
     * ES2015 introduced the `for..await..of` statement, allowing you to loop asynchronously over the async generators and functions.
     *
     * #### Example: Removing a role from every member in a guild.
     * ```ts
     * for await (const member of guild.getMembers()) {
     *   await member.removeRole(SOME_ROLE_ID);
     * }
     * ```
     *
     * @param options Options for the request. All values are optional.
     */
    getMembers(options?: Guild.IGetMembersOptions): AsyncIterableIterator<GuildMember>;

    /**
     * Fetches a single member from the guild, by user id.
     *
     * If the user is not a member of the guild, or the user is not found, the Promise will resolve as `null`.
     *
     * @param userId The id of the member you wish to fetch.
     */
    getMember(userId: Snowflake): Promise<GuildMember | null>;

    /**
     * Fetches an array containing the emojis uploaded to this guild.
     */
    getEmojis(): Promise<Emoji[]>;

    /**
     * Fetches a single emoji from the guild, by id.
     *
     * @param emojiId The id of the emoji you wish to fetch.
     */
    getEmoji(emojiId: Snowflake): Promise<Emoji | null>;

    /**
     * Builds a URL for the guild's icon, if set.
     *
     * See [[discord.Guild.icon]] for more info.
     *
     * @param type the preferred image type. Defaults to [[discord.ImageType.WEBP]].
     */
    getIconUrl(type?: discord.ImageType): string | null;

    /**
     * Builds a URL for the guild's splash image, if set.
     *
     * See [[discord.Guild.splash]] for more info.
     *
     * @param type the preferred image type. Defaults to [[discord.ImageType.PNG]].
     */
    getSplashUrl(
      type?: discord.ImageType.PNG | discord.ImageType.JPEG | discord.ImageType.WEBP
    ): string | null;

    /**
     * Builds a URL for the guild's banner image, if set.
     *
     * See [[discord.Guild.banner]] for more info.
     *
     * @param type the preferred image type. Defaults to [[discord.ImageType.PNG]].
     */
    getBannerUrl(
      type?: discord.ImageType.PNG | discord.ImageType.JPEG | discord.ImageType.WEBP
    ): string | null;

    /**
     * Disconnects any active voice sessions for the current bot user on this guild.
     */
    voiceDisconnect(): Promise<void>;
  }

  /**
   * A class that wraps information on a guild's individual audit log entry.
   */
  class AuditLogEntry {
    /**
     * The unique identifier for this audit log entry. Encodes the timestamp this event occurred at.
     */
    readonly id: Snowflake;
    /**
     * The id of the [[discord.User]] that performed this action.
     */
    readonly userId: Snowflake;
    /**
     * An instance of the [[discord.User]] that performed this action.
     */
    readonly user: discord.User;
    /**
     * The type of action the user performed.
     */
    readonly actionType: AuditLogEntry.ActionType;
    /**
     * An optional reason the user or bot provided when performing this action.
     */
    readonly reason: string;
    /**
     * If applicable, the id of the user, channel, or other Discord entity that this action applied to.
     */
    readonly targetId: Snowflake | null;
  }

  namespace AuditLogEntry {
    /**
     * An enumeration of all possible audit log entry types.
     */
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
      INTEGRATION_DELETE = 82,
    }

    /**
     * A type alias representing a union of all possible audit log entry types.
     */
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

    /**
     * Actions that have a new value and a potentially old value.
     *
     * These change types are typically included in actions that update objects.
     */
    interface IActionChange<T> {
      /**
       * The state of the value before the audit log action occurred. May be undefined.
       */
      oldValue?: T;
      /**
       * The state of the value after the audit log action occurred.
       */
      newValue: T;
    }

    /**
     * Actions that have a new value.
     *
     * These change types are typically included in actions that create entities.
     */
    interface IActionChangeNewValue<T> {
      /**
       * The state of the value after the audit log action occurred.
       */
      newValue: T;
    }

    /**
     * Actions that have an old value.
     *
     * These change types are typically included in actions that remove or delete entities.
     */
    interface IActionChangeOldValue<T> {
      /**
       * The state of the value before the audit log action occurred.
       */
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
    /**
     * Options passed to [[discord.GuildMember.edit]]. All properties are optional.
     */
    interface IGuildMemberOptions {
      /**
       * If specified, sets the nickname.
       *
       * Note: Sending an empty string will clear their username.
       */
      nick?: string;
      /**
       * If specified, replaces the member's roles with the list of role ids provided.
       */
      roles?: Snowflake[];
      /**
       * If specified, server-wide mutes or un-mutes a user's voice state
       */
      mute?: boolean;
      /**
       * If specified, server-wide deafens or un-deafens this member's voice state.
       */
      deaf?: boolean;
      /**
       * If the user is in a voice channel and this property is specified, it moves the member to the specified channel, by id.
       */
      channelId?: Snowflake | null;
    }
  }

  /**
   * A GuildMember is a wrapper around a [[discord.User]] containing information on their guild membership.
   *
   * Stores the member's nickname, list of roles, the time they joined, the time they started boosting the server, and a guild id.
   *
   * The class also contains a handful of utility methods, such as permission helpers, kick/ban functions, and role utilities. See the Functions below for more info.
   *
   * You can access the underlying user object via [[discord.GuildMember.user]].
   */
  class GuildMember implements IMentionable {
    /**
     * A reference to the underling [[discord.User]] object.
     */
    readonly user: discord.User;
    /**
     * The member's nickname, if set.
     */
    readonly nick: string | null;
    /**
     * An array of role ids this user has assigned to them.
     */
    readonly roles: Array<Snowflake>;
    /**
     * The date and time the member joined in ISO 8601 format (`YYYY-MM-DDTHH:mm:ss`).
     */
    readonly joinedAt: string;
    /**
     * The date and time the member started boosting (otherwise, `null`) in ISO 8601 format (`YYYY-MM-DDTHH:mm:ss`).
     */
    readonly premiumSince: string | null;
    /**
     * The guild id of the guild this member instance belongs to.
     */
    readonly guildId: Snowflake;
    /**
     * Calculated permissions for the member based on the currently assigned roles.
     *
     * Note: See [[GuildChannel.getMemberPermissions]] if you need channel-specific permissions.
     */
    readonly permissions: number;

    /**
     * Fetches an instance of the user for this guild member.
     *
     * @deprecated Simply use the [[discord.GuildMember.user]] property.
     */
    getUser(): Promise<User>;

    /**
     * Fetches an instance of the guild this member belongs to.
     */
    getGuild(): Promise<Guild>;

    /**
     * Updates the guild member.
     *
     * All properties of the `options` parameter are optional, but you must send at least one modification.
     *
     * If an error occurs, a [[discord.ApiError]] is thrown.
     *
     * @param updateData Properties to modify on this member.
     */
    edit(updateData: GuildMember.IGuildMemberOptions): Promise<void>;

    /**
     * Returns `true` if the member can perform actions that require the specified permission. Otherwise, `false` is returned.
     *
     * @param permission The permission to check for.
     */
    can(permission: Permissions): boolean;

    /**
     * Attempts to add a role (by id) to the member.
     *
     * Requires the [[discord.Permissions.MANAGE_ROLES]] permission.
     *
     * If an error occurs, a [[discord.ApiError]] is thrown.
     *
     * @param roleId
     */
    addRole(roleId: Snowflake): Promise<void>;

    /**
     * Attempts to remove a role (by id) to the member.
     *
     * Requires the [[discord.Permissions.MANAGE_ROLES]] permission.
     *
     * If an error occurs, a [[discord.ApiError]] is thrown.
     *
     * @param roleId
     */
    removeRole(roleId: Snowflake): Promise<void>;

    /**
     * Attempts to kick the member from the guild.
     *
     * If an error occurs, a [[discord.ApiError]] is thrown.
     */
    kick(): Promise<void>;

    /**
     * Attempts to ban the member from the guild.
     *
     * If an error occurs, a [[discord.ApiError]] is thrown.
     */
    ban(options?: Guild.IGuildBanOptions): Promise<void>;

    /**
     * Returns a mention string in the format of `<@!id>` where id is the id of this user.
     */
    toMention(): string;
  }

  namespace Role {
    /**
     * Options to use when calling [[discord.Role.edit]], all properties are optional.
     */
    interface IRoleOptions {
      /**
       * The name of the role.
       */
      name?: string;
      /**
       * The permission bits users extend when this role is assigned.
       */
      permissions?: number;
      /**
       * The color of this role. An integer representation of a hexadecimal color code.
       *
       * The default color for roles (no color) is `0`.
       *
       * Note: You can set this to a hex color code using an integer represented in hex format.
       *
       * Example: `0xFF0000` (or `16711680`) is red.
       */
      color?: number;
      /**
       * `true` if this role should be hoisted in the member list (displayed separately).
       */
      hoist?: boolean;
      /**
       * `true` if users should be able to mention and ping this role.
       */
      mentionable?: boolean;
    }
  }

  /**
   * A role belongs to a [[discord.Guild]] and can be assigned to groups of [[discord.GuildMember]]s to change the color of their name and apply permission changes.
   *
   * Multiple roles can be assigned to a single user.
   *
   * Roles can be hoisted in the member list (displayed separately), and ordered.
   */
  class Role implements IMentionable {
    /**
     * The role's unique Discord id. This field never changes.
     */
    readonly id: Snowflake;
    /**
     * The display name for the role.
     */
    readonly name: string;
    /**
     * The color for this role. It is a hexadecimal color code represented in integer format.
     *
     * The default color for roles (no color) is `0`.
     */
    readonly color: number;
    /**
     * `true` if this role is hoisted in the member list (displayed separately).
     *
     * Members are grouped into their highest positioned role in the member list if a role is hoisted.
     */
    readonly hoist: boolean;
    /**
     * The position of this role.
     *
     * Hoisted roles are displayed in this order.
     *
     * Role permissions are applied to members in the order of the permission set on roles.
     */
    readonly position: number;
    /**
     * The permission bit set assigned to this role. Members receive permissions in the order roles are positioned.
     */
    readonly permissions: number;
    /**
     * `true` if this role was created by an integration or bot application.
     *
     * Managed roles have restrictions around what can be edited, depending on the application.
     */
    readonly managed: boolean;
    /**
     * `true` if this role can be mentioned in messages by members of the guild.
     *
     * When a role is mentioned, they receive a ping/notification if they have notifications enabled for mentions on the guild.
     */
    readonly mentionable: boolean;
    /**
     * The id of the [[discord.Guild]] this role belongs to.
     */
    readonly guildId: Snowflake;

    /**
     * Updates the guild role.
     *
     * All properties of the `options` parameter are optional, but you must send at least one modification.
     *
     * If an error occurs, a [[discord.ApiError]] is thrown.
     *
     * @param options Properties to modify on this role.
     */
    edit(options: Role.IRoleOptions): Promise<Role>;

    /**
     * Deletes the role and removes it from all the members who had it assigned.
     *
     * If an error occurs, a [[discord.ApiError]] is thrown.
     */
    delete(): Promise<void>;

    /**
     * Returns a mention string in the format of `<@!id>` where id is the id of this user.
     *
     * Can be used in a message to mention/ping the role.
     */
    toMention(): string;
  }

  namespace Channel {
    /**
     * Represents any channel type on Discord that exists within a [[discord.Guild]].
     */
    type AnyGuildChannel =
      | GuildTextChannel
      | GuildVoiceChannel
      | GuildCategory
      | GuildNewsChannel
      | GuildStoreChannel;

    /**
     * Represents any channel type on Discord.
     */
    type AnyChannel = DmChannel | AnyGuildChannel;

    /**
     * Describes what permissions are allowed and denied per role or user.
     */
    interface IPermissionOverwrite {
      /**
       * The unique identifier of this permission overwrite.
       *
       * If the type is "member", it is a user id from [[discord.User.id]].
       * If the type is "role", it is a role id from [[discord.Role.id]].
       */
      id: Snowflake;
      /**
       * Either "role" or "member" depending on the entity this permission overwrite applies to.
       *
       * "member" overwrites take precedent over role overwrites.
       */
      type: Channel.PermissionOverwriteType;
      /**
       * The permission bit set allowed.
       */
      allow: number;
      /**
       * The permission bit set denied.
       */
      deny: number;
    }

    /**
     * Used in [[discord.Channel.IPermissionOverwrite]] to describe what entity the overwrite applies to.
     */
    const enum PermissionOverwriteType {
      ROLE = "role",
      MEMBER = "member",
    }

    /**
     * An enumeration of channel types.
     *
     * This is used on the [[discord.Channel.type]] property.
     */
    const enum Type {
      /**
       * A text chat channel within a [[discord.Guild]].
       *
       * Note: See [[discord.GuildTextChannel]].
       */
      GUILD_TEXT = 0,
      /**
       * A private 1-1 channel between the bot user and another [[discord.User]].
       *
       * Note: See [[discord.DMChannel]].
       */
      DM = 1,
      /**
       * A voice channel within a [[discord.Guild]].
       *
       * Note: See [[discord.GuildVoiceChannel]].
       */
      GUILD_VOICE = 2,
      /**
       * A text channel containing up to 10 unrelated [[discord.Users]].
       *
       * Note: Bots may not interact/view these channel types. This entry exists for reference purposes.
       */
      GROUP_DM = 3,
      /**
       * A category within a guild. Can be used to separate groups of channels under a single parent.
       *
       * Guild Channels within categories will have a channel id specified on [[discord.GuildChannel.parentId]].
       *
       * Note: See [[discord.GuildCategory]].
       */
      GUILD_CATEGORY = 4,
      /**
       * A special text channel that enables the use of the announcements system on Discord.
       *
       * Note: See [[discord.GuildNewsChannel]].
       */
      GUILD_NEWS = 5,
      /**
       * A special guild channel that enables commerce features. Typically used by studios utilizing Discord to distribute their game.
       *
       * Note: See [[discord.GuildStoreChannel]].
       */
      GUILD_STORE = 6,
    }
  }

  /**
   * Base channel class.
   *
   * All channels have an `id` and `type`.
   *
   * Note: Pylon should never provide an instance of [[discord.Channel]] directly. You will always be given a more specific child class.
   *
   * A channel can be type-refined by checking its [[discord.Channel.type]] type against [[discord.Channel.Type]].
   */
  class Channel {
    /**
     * Discord's unique identifier for this channel. This value never changes.
     */
    readonly id: Snowflake;
    /**
     * The type of channel this is. See [[discord.Channel.AnyChannel]] for a complete list of channel types.
     */
    readonly type: Channel.Type;

    /**
     * Attempts to delete the channel.
     *
     * If an error occurs, a [[discord.ApiError]] exception is thrown.
     */
    delete(): Promise<void>;
  }

  /**
   * A text channel represents any channel on Discord that store messages.
   *
   * The base methods available on this class are also available for all child classes.
   */
  interface ITextChannel {
    readonly type: Channel.Type;

    /**
     * Attempts to fetch a single [[discord.Message]] (by id) from this channel.
     *
     * If no message is found, the Promise resolves as `null`.
     *
     * @param messageId The id of the message you wish to fetch data for.
     */
    getMessage(messageId: string): Promise<Message | null>;

    /**
     * Attempts to send a message with additional options (embed, tts, allowedMentions) to this channel.
     *
     * Note: `content` OR `embed` **must** be set on the options properties.
     *
     * See [[discord.Message.OutgoingMessageOptions]] for descriptions on possible options.
     *
     * If an error occurs sending this message, a [[discord.ApiError]] exception will be thrown.
     *
     * @param outgoingMessageOptions Outgoing message options.
     */
    sendMessage(
      outgoingMessageOptions: Message.OutgoingMessageArgument<Message.OutgoingMessageOptions>
    ): Promise<Message>;

    /**
     * Attempts to send a simple message from a string to this channel.
     *
     * Note: If you'd like to send an embed or pass additional options, see [[discord.Message.OutgoingMessageOptions]]
     *
     * If an error occurs sending this message, a [[discord.ApiError]] exception will be thrown.
     *
     * @param content Content to use for the outgoing message.
     */
    sendMessage(content: Message.OutgoingMessageArgument<string>): Promise<Message>;

    /**
     * Attempts to send a message with only a [[discord.Embed]] attached.
     *
     * If an error occurs sending this message, a [[discord.ApiError]] exception will be thrown.
     *
     * @param embed The embed object you'd like to send to the channel.
     */
    sendMessage(embed: Message.OutgoingMessageArgument<Embed>): Promise<Message>;

    /**
     * Triggers the `*Username* is typing...` message to appear near the text input box for users focused on the channel.
     *
     * The typing indicator will last up to 15 seconds, or until the bot user sends a message in the channel. Whatever comes first.
     *
     * Typically unused by bots, but can be used to indicate a command response is "loading" or "processing."
     */
    triggerTypingIndicator(): Promise<void>;
  }

  /**
   * A private 1-1 channel between the bot user and another [[discord.User]].
   */
  class DmChannel extends Channel implements ITextChannel {
    /**
     * The type of this channel. Always [[discord.Channel.Type.DM]].
     */
    readonly type: Channel.Type.DM;

    /**
     * Attempts to fetch a single [[discord.Message]] (by id) from this channel.
     *
     * If no message is found, the Promise resolves as `null`.
     *
     * @param messageId The id of the message you wish to fetch data for.
     */
    getMessage(messageId: string): Promise<Message | null>;

    /**
     * Attempts to send a message with additional options (embed, tts, allowedMentions) to this channel.
     *
     * Note: `content` OR `embed` **must** be set on the options properties.
     *
     * See [[discord.Message.OutgoingMessageOptions]] for descriptions on possible options.
     *
     * If an error occurs sending this message, a [[discord.ApiError]] exception will be thrown.
     *
     * @param outgoingMessageOptions Outgoing message options.
     */
    sendMessage(
      outgoingMessageOptions: Message.OutgoingMessageArgument<Message.OutgoingMessageOptions>
    ): Promise<Message>;

    /**
     * Attempts to send a simple message from a string to this channel.
     *
     * Note: If you'd like to send an embed or pass additional options, see [[discord.Message.OutgoingMessageOptions]]
     *
     * If an error occurs sending this message, a [[discord.ApiError]] exception will be thrown.
     *
     * @param content Content to use for the outgoing message.
     */
    sendMessage(content: Message.OutgoingMessageArgument<string>): Promise<Message>;

    /**
     * Attempts to send a message with only a [[discord.Embed]] attached.
     *
     * If an error occurs sending this message, a [[discord.ApiError]] exception will be thrown.
     *
     * @param embed The embed object you'd like to send to the channel.
     */
    sendMessage(embed: Message.OutgoingMessageArgument<Embed>): Promise<Message>;

    /**
     * Triggers the `*Username* is typing...` message to appear near the text input box for users focused on the channel.
     *
     * The typing indicator will last up to 15 seconds, or until the bot user sends a message in the channel. Whatever comes first.
     *
     * Typically unused by bots, but can be used to indicate a command response is "loading" or "processing."
     */
    triggerTypingIndicator(): Promise<void>;
  }

  namespace GuildChannel {
    interface IGuildChannelOptions {
      /**
       * The name of this channel.
       */
      name?: string;
      /**
       * The position in the channel list this channel should be displayed at.
       */
      position?: number;
      /**
       * An array of permission overwrites to apply to this channel.
       *
       * Note: If set, this will overwrite existing permission overwrites.
       */
      permissionOverwrites?: Array<Channel.IPermissionOverwrite>;
      /**
       * The id of a [[discord.GuildCategory]] that this channel should be displayed under.
       */
      parentId?: Snowflake | null;
    }
  }

  /**
   * A base class containing properties and methods available for all channels that reside in a guild.
   *
   * You should never create/receive an instance of this class directly.
   */
  class GuildChannel extends Channel implements IMentionable {
    /**
     * The id of the [[discord.Guild]] this channel resides in.
     */
    readonly guildId: Snowflake;
    /**
     * The position in the channel list this channel should be displayed at.
     */
    readonly position: number;
    /**
     * Any member or role-specific permission overwrite settings for this channel.
     *
     * Note: You should use [[discord.GuildChannel.getMemberPermissions]] or the easier [[discord.GuildChannel.canMember]] function to test member permissions for a given channel.
     */
    readonly permissionOverwrites: Channel.IPermissionOverwrite[];
    /**
     * If the channel resides within a [[discord.GuildCategory]], its id is set on this property.
     */
    readonly parentId: Snowflake | null;
    /**
     * The name of this channel.
     */
    readonly name: string;
    /**
     * The type of this channel. See [[discord.Channel.AnyGuildChannel]] for a complete list of channel types.
     */
    readonly type:
      | Channel.Type.GUILD_CATEGORY
      | Channel.Type.GUILD_TEXT
      | Channel.Type.GUILD_NEWS
      | Channel.Type.GUILD_STORE
      | Channel.Type.GUILD_VOICE;

    /**
     * Attempts to update the given options for this channel.
     *
     * If an error occurs, a [[discord.ApiError]] will be thrown.
     *
     * @param updateData The settings to update for this channel.
     */
    edit(updateData: GuildChannel.IGuildChannelOptions): Promise<Channel.AnyGuildChannel>;

    /**
     * Attempts to fetch an instance of the [[discord.GuildCategory]] this channel resides in.
     *
     * If an error occurs, a [[discord.ApiError]] will be thrown.
     *
     * @returns If the channel does not reside in a cateogry, the Promise resolves as `null`.
     */
    getParent(): Promise<GuildCategory | null>;

    /**
     * Returns the calculated member permissions for this channel.
     *
     * It is built off the base member permissions via [[discord.GuildMember.permissions]] and the member and role-specific permission overwrites from [[discord.GuildChannel.permissionOverwrites]].
     *
     * Note: If you just want to see if a member has a permission, use [[discord.GuildChannel.canMember]].
     *
     * @param member The GuildMember you want to calculate channel-specific permissions for.
     * @returns The permission bit set calculated for the given member.
     */
    getMemberPermissions(member: GuildMember): number;

    /**
     * Determines if a member can perform actions that require the permission specified in this channel.
     *
     * Permissions are built off the base member permissions via [[discord.GuildMember.permissions]] and the member and role-specific permission overwrites from [[discord.GuildChannel.permissionOverwrites]].
     *
     * @param member The GuildMember you want to calculate channel-specific permissions for.
     * @param permission The permission you are checking for. Check [[discord.Permissions]] for an exhaustive list of all permissions.
     * @returns `true` if the permission is granted, otherwise `false`.
     */
    canMember(member: GuildMember, permission: Permissions): boolean;

    /**
     * Returns a mention string in the format of `<#id>` where id is the id of this channel.
     *
     * Can be used in a message to render a link to this channel.
     */
    toMention(): string;
  }

  /* GuildCategory */

  namespace GuildCategory {
    interface IGuildCategoryOptions extends GuildChannel.IGuildChannelOptions {
      /**
       * Must not be modified for GuildCategory, it is always null.
       */
      parent?: null;
    }
  }

  /**
   * A category within a guild. Can be used to separate groups of channels under a single parent.
   *
   * Guild channels within categories will have a channel id specified on [[discord.GuildChannel.parentId]].
   */
  class GuildCategory extends GuildChannel {
    /**
     * The type of this channel. Always [[Channel.Type.GUILD_CATEGORY]].
     */
    readonly type: Channel.Type.GUILD_CATEGORY;

    /**
     * Categories may not be nested, they will always have a null parentId.
     */
    readonly parentId: null;

    /**
     * Attempts to update the given options for this channel.
     *
     * If an error occurs, a [[discord.ApiError]] will be thrown.
     *
     * @param updateData The settings to update for this channel.
     */
    edit(updateData: GuildCategory.IGuildCategoryOptions): Promise<GuildCategory>;

    /**
     * Attempts to delete the channel.
     *
     * If an error occurs, a [[discord.ApiError]] exception is thrown.
     */
    delete(): Promise<void>;
  }

  namespace GuildVoiceChannel {
    interface IGuildVoiceChannelOptions extends GuildChannel.IGuildChannelOptions {
      /**
       * The bitrate for this voice channel. Voice quality increases as this value is raised at the expense of bandwidth usage.
       *
       * The default is `64000`. Servers without boosts may raise this up to `96000`. Servers with boosts may raise higher depending on the [[discord.Guild.PremiumTier]].
       */
      bitrate?: number;

      /**
       * Limits the number of users that can connect to the voice channel.
       *
       * Members with the [[discord.Permissions.VOICE_MOVE_MEMBERS]] may override this limit.
       */
      userLimit?: number;
    }
  }

  /**
   * A voice channel within a [[discord.Guild]].
   */
  class GuildVoiceChannel extends GuildChannel {
    /**
     * The bitrate for this voice channel. Voice quality increases as this value is raised at the expense of bandwidth usage.
     *
     * The default is `64000`. Servers without boosts may raise this up to `96000`. Servers with boosts may raise higher depending on the [[discord.Guild.PremiumTier]].
     */
    readonly bitrate: number;

    /**
     * Limits the number of users that can connect to the voice channel.
     *
     * Members with the [[discord.Permissions.VOICE_MOVE_MEMBERS]] may override this limit.
     */
    readonly userLimit: number;

    /**
     * The type of this channel. Always [[Channel.Type.GUILD_VOICE]].
     */
    readonly type: Channel.Type.GUILD_VOICE;

    /**
     * Attempts to update the given options for this channel.
     *
     * If an error occurs, a [[discord.ApiError]] will be thrown.
     *
     * @param updateData The settings to update for this channel.
     */
    edit(updateData: GuildVoiceChannel.IGuildVoiceChannelOptions): Promise<GuildVoiceChannel>;

    /**
     * Attempts to delete the channel.
     *
     * If an error occurs, a [[discord.ApiError]] exception is thrown.
     */
    delete(): Promise<void>;

    /**
     * Requests a voice session for this channel. Listen for [[discord.Event.VOICE_SERVER_UPDATE]] events for voice server connection information.
     *
     * If an error occurs, a [[discord.ApiError]] exception is thrown.
     */
    voiceConnect(): Promise<void>;
  }

  namespace GuildTextChannel {
    interface IGuildTextChannelOptions extends GuildChannel.IGuildChannelOptions {
      /**
       * The topic displayed above this channel.
       */
      topic?: string;
      /**
       * If `true`, sets the NSFW setting to enabled for this channel.
       */
      nsfw?: boolean;
      /**
       * How often (in seconds) users are able to send messages.
       *
       * Note: Discord calls this "slow-mode".
       *
       * Setting to `null` or `0` will disable slow-mode.
       */
      rateLimitPerUser?: number | null;
    }
  }

  /**
   * A text chat channel within a [[discord.Guild]].
   */
  class GuildTextChannel extends GuildChannel implements ITextChannel {
    /**
     * The topic displayed above this channel.
     */
    readonly topic: string | null;
    /**
     * If `true`, sets the NSFW setting to enabled for this channel.
     */
    readonly nsfw: boolean;
    /**
     * How often (in seconds) users are able to send messages.
     *
     * Note: Discord calls this "slow-mode".
     */
    readonly rateLimitPerUser: number | null;
    /**
     * The type of this channel. Always [[Channel.Type.GUILD_TEXT]].
     */
    readonly type: Channel.Type.GUILD_TEXT;

    /**
     * Attempts to update the given options for this channel.
     *
     * If an error occurs, a [[discord.ApiError]] will be thrown.
     *
     * @param updateData The settings to update for this channel.
     */
    edit(updateData: GuildTextChannel.IGuildTextChannelOptions): Promise<GuildTextChannel>;

    /**
     * Attempts to delete the channel.
     *
     * If an error occurs, a [[discord.ApiError]] exception is thrown.
     */
    delete(): Promise<void>;

    /**
     * Attempts to fetch a single [[discord.Message]] (by id) from this channel.
     *
     * If no message is found, the Promise resolves as `null`.
     *
     * @param messageId The id of the message you wish to fetch data for.
     */
    getMessage(messageId: string): Promise<Message | null>;

    /**
     * Attempts to send a message with additional options (embed, tts, allowedMentions) to this channel.
     *
     * Note: `content` OR `embed` **must** be set on the options properties.
     *
     * See [[discord.Message.OutgoingMessageOptions]] for descriptions on possible options.
     *
     * If an error occurs sending this message, a [[discord.ApiError]] exception will be thrown.
     *
     * @param outgoingMessageOptions Outgoing message options.
     */
    sendMessage(
      outgoingMessageOptions: Message.OutgoingMessageArgument<Message.OutgoingMessageOptions>
    ): Promise<Message>;

    /**
     * Attempts to send a simple message from a string to this channel.
     *
     * Note: If you'd like to send an embed or pass additional options, see [[discord.Message.OutgoingMessageOptions]]
     *
     * If an error occurs sending this message, a [[discord.ApiError]] exception will be thrown.
     *
     * @param content Content to use for the outgoing message.
     */
    sendMessage(content: Message.OutgoingMessageArgument<string>): Promise<Message>;

    /**
     * Attempts to send a message with only a [[discord.Embed]] attached.
     *
     * If an error occurs sending this message, a [[discord.ApiError]] exception will be thrown.
     *
     * @param embed The embed object you'd like to send to the channel.
     */
    sendMessage(embed: Message.OutgoingMessageArgument<Embed>): Promise<Message>;

    /**
     * Triggers the `*Username* is typing...` message to appear near the text input box for users focused on the channel.
     *
     * The typing indicator will last up to 15 seconds, or until the bot user sends a message in the channel. Whatever comes first.
     *
     * Typically unused by bots, but can be used to indicate a command response is "loading" or "processing."
     */
    triggerTypingIndicator(): Promise<void>;
  }

  namespace GuildNewsChannel {
    interface IGuildNewsChannelOptions extends GuildChannel.IGuildChannelOptions {
      /**
       * The topic displayed above this channel.
       */
      readonly topic?: string | null;
      /**
       * If `true`, sets the NSFW setting to enabled for this channel.
       */
      readonly nsfw?: boolean;
    }
  }

  /**
   * A special text channel that enables the use of the announcements system on Discord.
   */
  class GuildNewsChannel extends GuildChannel implements ITextChannel {
    /**
     * The topic displayed above this channel.
     */
    readonly topic: string | null;
    /**
     * If `true`, sets the NSFW setting to enabled for this channel.
     */
    readonly nsfw: boolean;
    /**
     * The type of this channel. Always [[Channel.Type.GUILD_NEWS]].
     */
    readonly type: Channel.Type.GUILD_NEWS;

    /**
     * Attempts to update the given options for this channel.
     *
     * If an error occurs, a [[discord.ApiError]] will be thrown.
     *
     * @param updateData The settings to update for this channel.
     */
    edit(updateData: GuildNewsChannel.IGuildNewsChannelOptions): Promise<GuildNewsChannel>;

    /**
     * Attempts to delete the channel.
     *
     * If an error occurs, a [[discord.ApiError]] exception is thrown.
     */
    delete(): Promise<void>;

    /**
     * Attempts to fetch a single [[discord.Message]] (by id) from this channel.
     *
     * If no message is found, the Promise resolves as `null`.
     *
     * @param messageId The id of the message you wish to fetch data for.
     */
    getMessage(messageId: string): Promise<Message | null>;

    /**
     * Attempts to send a message with additional options (embed, tts, allowedMentions) to this channel.
     *
     * Note: `content` OR `embed` **must** be set on the options properties.
     *
     * See [[discord.Message.OutgoingMessageOptions]] for descriptions on possible options.
     *
     * If an error occurs sending this message, a [[discord.ApiError]] exception will be thrown.
     *
     * @param outgoingMessageOptions Outgoing message options.
     */
    sendMessage(
      outgoingMessageOptions: Message.OutgoingMessageArgument<Message.OutgoingMessageOptions>
    ): Promise<Message>;

    /**
     * Attempts to send a simple message from a string to this channel.
     *
     * Note: If you'd like to send an embed or pass additional options, see [[discord.Message.OutgoingMessageOptions]]
     *
     * If an error occurs sending this message, a [[discord.ApiError]] exception will be thrown.
     *
     * @param content Content to use for the outgoing message.
     */
    sendMessage(content: Message.OutgoingMessageArgument<string>): Promise<Message>;

    /**
     * Attempts to send a message with only a [[discord.Embed]] attached.
     *
     * If an error occurs sending this message, a [[discord.ApiError]] exception will be thrown.
     *
     * @param embed The embed object you'd like to send to the channel.
     */
    sendMessage(embed: Message.OutgoingMessageArgument<Embed>): Promise<Message>;

    /**
     * Triggers the `*Username* is typing...` message to appear near the text input box for users focused on the channel.
     *
     * The typing indicator will last up to 15 seconds, or until the bot user sends a message in the channel. Whatever comes first.
     *
     * Typically unused by bots, but can be used to indicate a command response is "loading" or "processing."
     */
    triggerTypingIndicator(): Promise<void>;
  }

  namespace GuildStoreChannel {
    interface IGuildStoreChannelOptions extends GuildChannel.IGuildChannelOptions {}
  }

  /**
   * A special guild channel that enables commerce features. Typically used by studios utilizing Discord to distribute their game.
   */
  class GuildStoreChannel extends GuildChannel {
    /**
     * The type of this channel. Always [[Channel.Type.GUILD_STORE]].
     */
    readonly type: Channel.Type.GUILD_STORE;

    /**
     * Attempts to update the given options for this channel.
     *
     * If an error occurs, a [[discord.ApiError]] will be thrown.
     *
     * @param updateData The settings to update for this channel.
     */
    edit(updateData: GuildStoreChannel.IGuildStoreChannelOptions): Promise<GuildStoreChannel>;

    /**
     * Attempts to delete the channel.
     *
     * If an error occurs, a [[discord.ApiError]] exception is thrown.
     */
    delete(): Promise<void>;
  }

  namespace Embed {
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
      /**
       * The external url of the embed image.
       *
       * Note: This property should only be set for outgoing embeds created by the bot.
       */
      url?: string;
      /**
       * The proxied embed image url.
       *
       * Note: Only appears on embeds returned from Discord's API
       */
      readonly proxyUrl?: string;
      /**
       * The height of the embed image.
       *
       * Note: Only appears on embeds returned from Discord's API
       */
      readonly height?: number;
      /**
       * The width of the embed image.
       *
       * Note: Only appears on embeds returned from Discord's API
       */
      readonly width?: number;
    }

    interface IEmbedThumbnail {
      /**
       * The external url of the embed thumbnail image.
       *
       * Note: This property should only be set for outgoing embeds created by the bot.
       */
      url?: string;
      /**
       * The proxied thumbnail url.
       *
       * Note: Only appears on embeds returned from Discord's API
       */
      readonly proxyUrl?: string;
      /**
       * The height of the thumbnail image.
       *
       * Note: Only appears on embeds returned from Discord's API
       */
      readonly height?: number;
      /**
       * The width of the thumbnail image.
       *
       * Note: Only appears on embeds returned from Discord's API
       */
      readonly width?: number;
    }

    interface IEmbedVideo {
      /**
       * The external source url pointing to the embed video.
       *
       * Note: This property should only be set for outgoing embeds created by the bot.
       */
      url?: string;
      /**
       * The height of the video.
       *
       * Note: Only appears on embeds returned from Discord's API
       */
      readonly height?: number;
      /**
       * The width of the video.
       *
       * Note: Only appears on embeds returned from Discord's API
       */
      readonly width?: number;
    }

    interface IEmbedProvider {
      /**
       * An external url that links from the provider's name.
       *
       */
      url?: string;
      /**
       * The name of the embed provider.
       */
      name?: string;
    }

    interface IEmbedAuthor {
      /**
       * An external url that links from the author's name.
       */
      url?: string;
      /**
       * The name of the author.
       */
      name?: string;
      /**
       * An external url that points to an image icon for the author. Renders next to the name.
       */
      iconUrl?: string;
      /**
       * Contains the Discord-proxied icon url.
       *
       * Note: Only appears on embeds returned from Discord's API
       */
      readonly proxyIconUrl?: string;
    }

    interface IEmbedFooter {
      /**
       * Footer text for this embed.
       */
      text: string;
      /**
       * An external url that points to an image icon for the footer. Renders next to the text.
       *
       * Note: This property should only be set for outgoing embeds created by the bot.
       */
      iconUrl?: string;
      /**
       * Contains the Discord-proxied footer icon url.
       *
       * Note: Only appears on embeds returned from Discord's API
       */
      readonly proxyIconUrl?: string;
    }

    interface IEmbedField {
      /**
       * The name or heading of this field. Up to 256 characters.
       */
      name: string;
      /**
       * The value or body of this field. Up to 1024 characters.
       *
       * Supports partial markdown.
       */
      value: string;
      /**
       * `true` if this field should be rendered in-line.
       *
       * `false` (default) will always render fields on new lines.
       */
      inline?: boolean;
    }

    interface IEmbed {
      /**
       * The title of the embed.
       */
      title?: string;
      /**
       * The type of the embed.
       */
      type?: string;
      /**
       * The description text for the embed. Up to 2048 characters.
       */
      description?: string;
      /**
       * The url of the embed. It renders as a link on the name, if provided.
       */
      url?: string;
      /**
       * The ISO-8601 UTC timestamp for this embed.
       */
      timestamp?: string;
      /**
       * The numerically encoded RGB color code for this embed.
       */
      color?: number;
      /**
       * The footer for this embed. The text may be up to 2048 characters.
       */
      footer?: Embed.IEmbedFooter;
      /**
       * The image data for this embed.
       */
      image?: Embed.IEmbedImage;
      /**
       * The thumbnail data for this embed.
       */
      thumbnail?: Embed.IEmbedThumbnail;
      /**
       * The video data for this embed.
       */
      video?: Embed.IEmbedVideo;
      /**
       * The provider data for this embed.
       */
      provider?: Embed.IEmbedProvider;
      /**
       * The author data for this embed. The name field may be up to 256 characters.
       */
      author?: Embed.IEmbedAuthor;
      /**
       * An array of fields to be rendered on this embed.
       *
       * Field names may be up to 256 characters. Field values may be up to 1024 characters, and support markdown.
       */
      fields?: Array<Embed.IEmbedField>;
    }
  }

  /**
   * Discord allows us to send Rich Embed objects attached to messages that render as nice info boxes in chat.
   *
   * #### Example: Send an embed with some customization in response to an !info command.
   * ```ts
   * const commands = new discord.command.CommandGroup({
   *  defaultPrefix: '!'
   * });
   *
   * commands.registerCommand(
   *  "info",
   *  args => ({
   *    user: args.user()
   *  }),
   *  async ({ message }, { user }) => {
   *    // build the rich embed
   *    const richEmbed = new discord.Embed();
   *    richEmbed.setTitle(user.getTag()).setColor(0x00ff00);
   *    richEmbed.setDescription("User Information Example");
   *    richEmbed.setThumbnail({ url: user.getAvatarUrl() });
   *    richEmbed.addField({
   *      name: "User ID",
   *      value: user.id,
   *      inline: false
   *    });
   *    richEmbed.setTimestamp(new Date().toISOString());
   *    // reply to the command with our embed
   *    await message.reply({ content: "", embed: richEmbed });
   *  }
   *);
   *```
   */
  class Embed {
    /**
     * The title of the embed.
     */
    readonly title: string | null;
    /**
     * The type of the embed.
     */
    readonly type: string | null;
    /**
     * The description text for the embed. Up to 2048 characters.
     */
    readonly description: string | null;
    /**
     * The url of the embed. It renders as a link on the name, if provided.
     */
    readonly url: string | null;
    /**
     * The ISO-8601 UTC timestamp for this embed.
     */
    readonly timestamp: string | null;
    /**
     * The numerically encoded RGB color code for this embed.
     */
    readonly color: number | null;
    /**
     * The footer for this embed. The text may be up to 2048 characters.
     */
    readonly footer: Embed.IEmbedFooter | null;
    /**
     * The image data for this embed.
     */
    readonly image: Embed.IEmbedImage | null;
    /**
     * The thumbnail data for this embed.
     */
    readonly thumbnail: Embed.IEmbedThumbnail | null;
    /**
     * The video data for this embed.
     */
    readonly video: Embed.IEmbedVideo | null;
    /**
     * The provider data for this embed.
     */
    readonly provider: Embed.IEmbedProvider | null;
    /**
     * The author data for this embed. The name field may be up to 256 characters.
     */
    readonly author: Embed.IEmbedAuthor | null;
    /**
     * An array of fields to be rendered on this embed.
     *
     * Field names may be up to 256 characters. Field values may be up to 1024 characters, and support markdown.
     */
    readonly fields: Array<Embed.IEmbedField>;

    /**
     * Constructs an Embed instance with the data provided.
     *
     * @param init The options for this embed.
     */
    constructor(init?: Embed.IEmbed);

    /**
     * Sets the title of this embed.
     * @param title A new title for the embed. Must be no more than 256 characters.
     */
    setTitle(title: string | null): Embed;
    /**
     * Sets the type of this embed. Always `rich` for webhook embeds.
     * @param type The type of this embed.
     */
    setType(type: string | null): Embed;
    /**
     * Sets the description for this embed.
     *
     * May contain markdown-formatted text, including links.
     *
     * @param description The description for this embed. Up to 2048 characters.
     */
    setDescription(description: string | null): Embed;
    /**
     * Adds a link to the specified URL to the title of this embed.
     *
     * Note: Requires a title to be set.
     * @param url The url of this embed.
     * */
    setUrl(url: string | null): Embed;
    /**
     * A localized timestamp to render at the bottom of the embed.
     *
     * Should be set to a UTC time string in ISO 8601 format (`YYYY-MM-DDTHH:mm:ss`)
     *
     * For example, `new Date().toISOString()` returns the current date and time in this format.
     * @param timestamp The ISO-8601 formatted timestamp string to set the embed timestamp to.
     */
    setTimestamp(timestamp: string | null): Embed;
    /**
     * Sets the color for this embed. An integer representation of a hexadecimal color code.
     *
     * The default color for roles (no color) is `0`.
     *
     * Note: You can set this to a hex color code using an integer represented in hex format.
     *
     * Example: `0xFF0000` (or `16711680`) is red.
     * @param color The integer representation of a color.
     */
    setColor(color: number | null): Embed;
    /**
     * Sets the footer for this embed. Rendered at the bottom of an embed.
     *
     * @param footer The footer for this embed. The text property may be up to 2048 characters.
     */
    setFooter(footer: Embed.IEmbedFooter | null): Embed;
    /**
     * Sets an image for this embed. If set, the image is typically rendered below the description and fields.
     *
     * You must only set the `url` property of the options sent to this function.
     *
     * @param image Embed image options.
     */
    setImage(image: Embed.IEmbedImage | null): Embed;
    /**
     * Sets a thumbnail for this embed. If set, the thumbnail is typically rendered to the right of the description and fields.
     *
     * You must only set the `url` property of the options sent to this function.
     * @param thumbnail Embed thumbnail options.
     */
    setThumbnail(thumbnail: Embed.IEmbedThumbnail | null): Embed;
    /**
     * Sets an video for this embed. If set, the video is typically rendered below the description and fields.
     *
     * You must only set the `url` property of the options sent to this function.
     * @param video Embed thumbnail options.
     */
    setVideo(video: Embed.IEmbedVideo | null): Embed;
    /**
     * Sets a provider for this embed. Contains a name and url.
     *
     * @param provider Embed provider options.
     */
    setProvider(provider: Embed.IEmbedProvider | null): Embed;
    /**
     * Sets the author options for this embed.
     *
     * You may set an author name, url and icon image url.
     *
     * @param author Embed author options.
     */
    setAuthor(author: Embed.IEmbedAuthor | null): Embed;
    /**
     * Replaces the array of [[discord.Embed.IEmbedField]] objects with the one provided.
     *
     * Note: You can add individual fields easily using [[discord.Embed.addField]].
     *
     * @param fields Array of field objects. Provide an empty array to clear the fields.
     */
    setFields(fields: Array<Embed.IEmbedField>): Embed;

    /**
     * Adds a field to the embed.
     *
     * Fields appear under the description. Inline fields may be rendered side-by-side depending on the screen width.
     *
     * @param field A field object.
     */
    addField(field: Embed.IEmbedField): Embed;
  }

  namespace Emoji {
    /**
     * A basic emoji discriptor.
     *
     * Guild emojis contain an id and custom name.
     *
     * Standard unicode emojis will have a null id with the name being the literal emoji characters.
     */
    interface IEmoji {
      /**
       * The id of the emoji, if set.
       */
      id: Snowflake | null;
      /**
       * The custom name of the emoji, or a literal unicode emoji.
       */
      name: string;
    }

    /**
     * Represents a custom emoji added to the guild.
     *
     * Custom emojis can be animated.
     *
     * Some rare custom emoji may be global, or may not require the use of colons if linked from twitch.
     */
    interface IGuildEmoji extends IEmoji {
      /**
       * The type of emoji this is. Always [[discord.Emoji.Type.GUILD]].
       */
      type: Emoji.Type.GUILD;
      /**
       * Discord's unique identifier for this emoji.
       */
      id: Snowflake;
      /**
       * The custom name of this emoji, example: `:name:`.
       */
      name: string;
      /**
       * If not empty, the roles in this array have access to the emoji.
       */
      roles?: Array<Snowflake>;
      /**
       * The user who uploaded the emoji.
       */
      user?: User;
      /**
       * If `true` (default), the emoji requires colons. You cannot change this field.
       */
      requireColons?: boolean;
      /**
       * If `true`, this emoji is managed by an integration and you cannot modify it.
       */
      managed?: boolean;
      /**
       * If `true`, this emoji is animated.
       */
      animated?: boolean;
    }

    /**
     * Represents a standard unicode emoji included with Discord.
     */
    interface IUnicodeEmoji extends IEmoji {
      /**
       * The type of this emoji. Always [[discord.Emoji.Type.UNICODE]].
       */
      type: Emoji.Type.UNICODE;
      /**
       * The unique identifier for this emoji. Always `null` for unicode emojis.
       */
      id: null;
      /**
       * The unicode representation of this emoji. Example: `🎉`
       */
      name: string;
    }

    /**
     * An enumeration of the possible types of emojis seen on Discord.
     */
    const enum Type {
      /**
       * See [[discord.Emoji.IGuildEmoji]].
       */
      GUILD = "GUILD",
      /**
       * See [[discord.Emoji.IUnicodeEmoji]].
       */
      UNICODE = "UNICODE",
    }

    /**
     * A type union of all possible emoji types.
     */
    type AnyEmoji = Emoji.IGuildEmoji | Emoji.IUnicodeEmoji;
  }

  /**
   * A class wrapper around emoji data. Can represent a unicode or custom emoji.
   */
  class Emoji implements Emoji.IEmoji, IMentionable {
    /**
     * Discord's unique identifier for this emoji.
     *
     * If null, the emoji is a unicode emoji and will only have the `name` and `type` property set.
     */
    readonly id: Snowflake | null;
    /**
     * The custom name for this emoji, if it's a guild emoji.
     *
     * Otherwise, the name is the literal emoji character(s). Example: `🎉`
     */
    readonly name: string;
    /**
     * The type of emoji this is.
     */
    readonly type: Emoji.Type;
    /**
     * If not empty, the roles in this array have access to the emoji.
     */
    readonly roles: Snowflake[];
    /**
     * The user who uploaded the emoji.
     */
    readonly user: User | null;
    /**
     * If `true` (default), the emoji requires colons. You cannot change this field.
     */
    readonly requireColons: boolean;
    /**
     * If `true`, this emoji is managed by an integration and you cannot modify it.
     */

    readonly managed: boolean;
    /**
     * If `true`, this emoji is animated.
     */
    readonly animated: boolean;

    /**
     * @returns A message-ready string representation of the emoji.
     */
    toMention(): string;
  }

  /* Message */

  namespace Message {
    /**
     * An enumeration of possible message types.
     */
    const enum Type {
      /**
       * A default message. Contains text and/or embeds sent by a user, bot, or webhook.
       */
      DEFAULT = 0,
      /**
       * A message in a channel that denotes a message was pinned.
       */
      CHANNEL_PINNED_MESSAGE = 4,
      /**
       * A special message that appears in the system channel that a guild member has joined the server.
       */
      GUILD_MEMBER_JOIN = 7,
      /**
       * A special message that appears in the system channel when a member boosts a server.
       */
      USER_PREMIUM_GUILD_SUBSCRIPTION = 8,
      /**
       * A special message that appears in the system channel when a guild is boosted to tier 1.
       */
      USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_1 = 9,
      /**
       * A special message that appears in the system channel when a guild is boosted to tier 2.
       */
      USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_2 = 10,
      /**
       * A special message that appears in the system channel when a guild is boosted to tier 3.
       */
      USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_3 = 11,
      /**
       * A special message that appears in a channel when it begins following an announcements channel.
       */
      CHANNEL_FOLLOW_ADD = 12,
    }

    /**
     * A bit flag set for messages, defines special properties or behavior.
     */
    const enum Flags {
      /**
       * Set if the message was published. Only valid for messages sent in [[discord.GuildNewsChannel]] channels.
       */
      CROSSPOSTED = 1 << 0,
      /**
       * Set if the message is a news message cross-posted from another server's [[discord.GuildNewsChannel]] channel.
       */
      IS_CROSSPOST = 1 << 1,
      /**
       * Set if the embed has been suppressed.
       */
      SUPPRESS_EMBEDS = 1 << 2,
    }

    /**
     * An enumeration of possible activity types associated with a [[discord.Message]].
     */
    const enum ActivityType {
      JOIN = 1,
      SPECTATE = 2,
      LISTEN = 3,
      JOIN_REQUEST = 5,
    }

    /**
     * An object that represents a unique emoji reaction on a [[discord.Message]].
     */
    interface IMessageReaction {
      /**
       * The number of times this emoji has been reacted with.
       */
      count: number;
      /**
       * `true` if the count includes a reaction from the current bot user.
       */
      me: boolean;
      /**
       * A reference to an emoji object used for this reaction.
       */
      emoji: Emoji;
    }

    /**
     * An object that represents channel data for a channel mentioned in a message.
     */
    interface IMessageChannelMention {
      /**
       * The id of the channel mentioned.
       */
      id: Snowflake;
      /**
       * The id of the guild this mentioned channel belongs to.
       */
      guildId: Snowflake;
      /**
       * The type of channel mentioned.
       */
      type: Channel.Type;
      /**
       * The name of the channel mentinoed.
       */
      name: string;
    }

    /**
     * An object that represents an attachment included with a message.
     */
    interface IMessageAttachment {
      /**
       * The unique identifier for this attachment.
       */
      id: Snowflake;
      /**
       * The attachment's file name.
       */
      filename: string;
      /**
       * The size of the attachment in bytes.
       */
      size: number;
      /**
       * The url where this attachment can be retrieved from.
       */
      url: string;
      /**
       * The proxied url for this attachment.
       */
      readonly proxyUrl: string;
      /**
       * If the attachment is a media file, the width of the image or video.
       */
      readonly height?: number;
      /**
       * If the attachment is a media file, the height of the image or video.
       */
      readonly width?: number;
    }

    /**
     * An object that represents an activity included with a message.
     */
    interface IMessageActivity {
      /**
       * The type of activity.
       */
      type: Message.ActivityType;
      /**
       * The party id others may use to join this activity, if provided.
       */
      partyId?: string;
    }

    /**
     * An object that represents an application included a message.
     */
    interface IMessageApplication {
      /**
       * The application's unique identifier.
       */
      id: Snowflake;
      /**
       * A cover image for activity embeds.
       */
      coverImage?: string;
      /**
       * The description for this application.
       */
      description: string;
      /**
       * The icon hash for this application.
       */
      icon: string | null;
      /**
       * The name of this application.
       */
      name: string;
    }

    /**
     * An object that represents a cross-link message reference. Used for announcement messages.
     */
    interface IMessageReference {
      /**
       * The message id of the cross-posted message.
       */
      messageId?: Snowflake;
      /**
       * The channel id of the cross-posted message.
       */
      channelId?: Snowflake;
      /**
       * The id of the guild where this cross-posted message originated.
       */
      guildId?: Snowflake;
    }

    /**
     * Options available for outgoing messages.
     *
     * Note: If an embed is not included, `content` must be included and greater than 0 characters long.
     *
     * See [[discord.Message.IAllowedMentions]] for more information on the `allowedMentions` property.
     */
    interface IOutgoingMessageOptions {
      /**
       * The message's text content.
       *
       * If the message has no embed, the content must be greater than 0 characters in length.
       */
      content?: string;
      /**
       * If `true`, clients with tts enabled and are focused on the channel will hear the message via text-to-speech.
       */
      tts?: boolean;
      /**
       * An optional [[discord.Embed]] to include with this message.
       *
       * If `null`, the embed will be removed. If removing the embed, you must send the content property.
       */
      embed?: Embed | null;
      /**
       * If set, will restrict the notifications sent with this message if mention strings are included.
       *
       * By default (undefined), the message will be allowed to ping all mentioned entities.
       *
       * It is highly recommended you specify this property when sending messages that include user input.
       *
       * Setting this property to an empty object (ex: `{}`) will prevent any messages from being sent. See [[discord.Message.IAllowedMentions]] for more details on the possible configurations for this property.
       */
      allowedMentions?: IAllowedMentions;
    }

    /**
     * A type-alias used to describe the possible options for message content. See [[discord.Message.IOutgoingMessageOptions]] for a full list of options.
     */
    type OutgoingMessageOptions = IOutgoingMessageOptions &
      (
        | { content: string; embed?: Embed }
        | { content?: string; embed: Embed }
        | { content: string; embed: null }
      );

    /**
     * Allowed mentions lets you fine-tune what mentions are notified in outgoing messages. It is highly recommended you include this option when sending message content containing user input.
     *
     * Setting this option to `{}` will block all mentions from notifying their targets.
     */
    interface IAllowedMentions {
      /**
       * If set to true, this message will be allowed to ping at-everyone.
       */
      everyone?: boolean;
      /**
       * If set to true, this message will be allowed to ping all role mentions.
       *
       * You may pass an array of role ids or role objects to whitelist a set of roles you'd like to restrict notifications to.
       */
      roles?: true | Array<Snowflake | Role>;
      /**
       * If set to true, this message will be allowed to ping all users mentioned.
       *
       * You may pass an array of user ids or user/guildMember objects to whitelist a set of users you'd like to restrict notifications to.
       */
      users?: true | Array<Snowflake | User | GuildMember>;
    }

    /**
     * A type alias to describe any message class type.
     */
    type AnyMessage = discord.Message | discord.GuildMemberMessage;

    /**
     * A type alias to describe possible outgoing message types.
     */
    type OutgoingMessage = string | OutgoingMessageOptions | Embed;

    /**
     * A type alias to describe the possible configurations to use when sending a message.
     *
     * If a Promise-like type is used, the bot will send a typing indicator for the channel before resolving the Promise and sending its content.
     */
    type OutgoingMessageArgument<T extends OutgoingMessage> = T | Promise<T> | (() => Promise<T>);
  }

  class Message {
    /**
     * The unique id for this message. The id can be used to find the time the message was created.
     */
    readonly id: Snowflake;
    /**
     * The id of the text channel this message was sent in.
     *
     * Note: You can fetch the full channel data with [[discord.Message.getChannel]].
     */
    readonly channelId: Snowflake;
    /**
     * The id of the guild this message was sent in. Will be `null` for messages sent in [[discord.DMChannel]] DM channels.
     *
     * Note: You can fetch the full guild data with [[discord.Message.getGuild]].
     */
    readonly guildId: Snowflake | null;
    /**
     * The text content of this message.
     *
     * May contain up to 2000 characters.
     */
    readonly content: string;
    /**
     * An array of embeds included with this message.
     */
    readonly embeds: Array<discord.Embed>;
    /**
     * The author of this message, if any.
     */
    readonly author: User | null;
    /**
     * If the message was sent in a guild, the [[discord.GuildMember]] who sent this message.
     */
    readonly member: GuildMember | null;
    /**
     * The timestamp at which this message was sent at, in ISO-8601 format.
     */
    readonly timestamp: string;
    /**
     * The timestamp at which the message was last edited at, in ISO-8601 format.
     */
    readonly editedTimestamp: string | null;
    /**
     * `true` if this message mentions everyone.
     */
    readonly mentionEveryone: boolean;
    /**
     * An array of user objects, containing partial member objects, of users mentioned in this message.
     */
    readonly mentions: Array<User & { member: Omit<GuildMember, "user"> }>;
    /**
     * An array of role ids mentioned in this channel.
     */
    readonly mentionRoles: Array<Snowflake>;
    /**
     * An array of partial channel objects mentioned in this channel.
     */
    readonly mentionChannels: Array<Message.IMessageChannelMention>;
    /**
     * An array of attachments sent with this message.
     */
    readonly attachments: Array<Message.IMessageAttachment>;
    /**
     * An array of emoji reactions added to this message.
     */
    readonly reactions: Array<Message.IMessageReaction>;
    /**
     * `true` if this message is pinned to the channel.
     */
    readonly pinned: boolean;
    /**
     * The id of the webhook that sent this message. `null` if this message was not sent by a webhook.
     */
    readonly webhookId: Snowflake | null;
    /**
     * The type of message this is. See [[discord.Message.Type]] for a list of possible values.
     */
    readonly type: Message.Type;
    /**
     * The activity object included with this message, if set.
     */
    readonly activity: Message.IMessageActivity | null;
    /**
     * The application metadata used to render activity data for a message, if set.
     */
    readonly application: Message.IMessageApplication | null;
    /**
     * The original message reference for cross-posted announcement messages.
     */
    readonly messageReference: Message.IMessageReference | null;
    /**
     * A bit set of flags containing more information for this message.
     */
    readonly flags: Message.Flags | null;

    /**
     * Fetches data for the channel this message was sent in.
     */
    getChannel(): Promise<
      discord.DmChannel | (discord.GuildTextChannel | discord.GuildNewsChannel)
    >;

    /**
     * Fetches the data for the guild this message was sent in.
     *
     * If the message was not sent in a guild, the Promise resolves as `null`.
     */
    getGuild(): Promise<Guild | null>;

    /**
     * Attempts to send a message with additional options (embed, tts, allowedMentions) to the channel this message was sent in.
     *
     * Note: `content` OR `embed` **must** be set on the options properties.
     *
     * See [[discord.Message.OutgoingMessageOptions]] for descriptions on possible options.
     *
     * If an error occurs sending this message, a [[discord.ApiError]] exception will be thrown.
     *
     * @param outgoingMessageOptions Outgoing message options.
     */
    reply(
      outgoingMessageOptions: Message.OutgoingMessageArgument<Message.OutgoingMessageOptions>
    ): Promise<Message>;

    /**
     * Attempts to send a simple text message to the channel this message was sent in.
     *
     * Note: If you'd like to send an embed or pass additional options, see [[discord.Message.OutgoingMessageOptions]]
     *
     * If an error occurs sending this message, a [[discord.ApiError]] exception will be thrown.
     *
     * @param content Content to use for the outgoing message.
     */
    reply(content: Message.OutgoingMessageArgument<string>): Promise<Message>;

    /**
     * Attempts to send an [[discord.Embed]] to the channel this message was sent in.
     *
     * If an error occurs sending this message, a [[discord.ApiError]] exception will be thrown.
     *
     * @param embed The embed object you'd like to send to the channel.
     */
    reply(embed: Message.OutgoingMessageArgument<Embed>): Promise<Message>;

    /**
     * Attempts to permanently delete this message.
     *
     * If an error occurred, a [[discord.ApiError]] exception is thrown.
     */
    delete(): Promise<void>;

    /**
     * Reacts to this message with the specified emoji.
     *
     * If an error occurred, a [[discord.ApiError]] exception is thrown.
     *
     * @param emoji A raw unicode emoji like ✅, or a custom emoji in the format of `name:id`
     */
    addReaction(emoji: string): Promise<void>;

    /**
     * Deletes the bot user's own reaction to this message of the specified emoji.
     *
     * If an error occurred, a [[discord.ApiError]] exception is thrown.
     *
     * @param emoji A raw unicode emoji like ✅, or a custom emoji in the format of `name:id`
     */
    deleteOwnReaction(emoji: string): Promise<void>;

    /**
     * Deletes a user's reaction to the message.
     *
     * If an error occurred, a [[discord.ApiError]] exception is thrown.
     *
     * @param emoji A raw unicode emoji like ✅, or a custom emoji in the format of `name:id`
     * @param user A user id or reference to a user object.
     */
    deleteReaction(emoji: string, user: Snowflake | User): Promise<void>;

    /**
     * Attempts to edit a message. Messages may only be edited by their author.
     *
     * If you wish to remove an embed from the message, set the `embed` property to null.
     * The message content may be set to an empty string only if the message has or is receiving an embed with the edit.
     *
     * Note: You may not modify `allowedMentions` or `tts` when editing a message, these only apply when a message is initially received.
     *
     * If an error occurred, a [[discord.ApiError]] exception is thrown.
     *
     * @param messageOptions New message options for this message.
     * @returns On success, the Promise resolves as the new message object.
     */
    edit(
      messageOptions: Pick<Message.OutgoingMessageOptions, "content" | "embed">
    ): Promise<Message>;

    /**
     * Attempts to edit a message. Replaces the content with the new provided content.
     *
     * Messages may only be edited if authored by the bot.
     *
     * Note: If you'd like more options (embeds, allowed mentions, etc) see [[discord.Message.OutgoingMessageOptions]].
     *
     * If an error occurred, a [[discord.ApiError]] exception is thrown.
     *
     * @param content New content for this message.
     * @returns On success, the Promise resolves as the new message object.
     */
    edit(content: string): Promise<Message>;

    /**
     * Attempts to edit a message. Sets the content to an empty string and adds or updates the embed associated with this message.
     *
     * Messages may only be edited if authored by the bot.
     *
     * If an error occurred, a [[discord.ApiError]] exception is thrown.
     *
     * @param embed A new [[discord.Embed]] for this message.
     * @returns On success, the Promise resolves as the new message object.
     */
    edit(embed: Embed): Promise<Message>;

    /**
     * Changes the pinned status of this message.
     *
     * @param pinned `true` if the message should be pinned, otherwise `false`.
     */
    setPinned(pinned: boolean): Promise<void>;
  }

  class GuildMemberMessage extends Message {
    /**
     * The id of the guild this message was sent in. Always set for messages of this type.
     *
     * Note: You can fetch the full guild data with [[discord.Message.getGuild]].
     */
    readonly guildId: Snowflake;
    /**
     * The author of this message. Always set for messages of this type.
     */
    readonly author: User;
    /**
     * The guild member who authored this message. Always set for messages of this type.
     */
    readonly member: GuildMember;
    /**
     * The webhook id that created this message. Always `null` for messages of this type.
     */
    readonly webhookId: null;

    /**
     * Messages of this type are always [[Message.Type.DEFAULT]].
     */
    readonly type: Message.Type.DEFAULT;

    /**
     * Messages of this type may never reference another object.
     */
    readonly messageReference: null;

    /**
     * Fetches the data for the guild this message was sent in.
     *
     * If the message was not sent in a guild, the Promise resolves as `null`.
     */
    getGuild(): Promise<discord.Guild>;

    /**
     * Fetches data for the channel this message was sent in.
     */
    getChannel(): Promise<discord.GuildTextChannel | discord.GuildNewsChannel>;
  }

  /**
   * An object representing an invite on Discord.
   *
   * Invites typically appear as links (ex: discord.gg/hC6Bbtj) where the code is a unique and random string of alpha-numeric characters.
   *
   * Since Group DMs may create invites, some properties on the invite object are nullable.
   */
  class Invite {
    /**
     * The unique identifier for this invite. May be used by user accounts to join a guild or group dm.
     */
    code: Snowflake;
    /**
     * Partial guild data for this invite, if relevant.
     */
    guild: Invite.GuildData | null;
    /**
     * Partial channel data for this invite.
     *
     * Users who use this invite will be redirected to the channel id.
     */
    channel: Invite.ChannelData;
    /**
     * The user object who created this invite, if relevant.
     */
    inviter: discord.User | null;
    /**
     * If the invite is for a guild, this includes an approximate count of members online in the guild.
     *
     * Requires that the invite was retrieved with [[discord.Invite.IGetGuildOptions.withCounts]] set to `true`.
     */
    approximatePresenceCount: number | null;
    /**
     * If the invite is for a guild channel, this number is the approximate total member count for the guild.
     *
     * Requires that the invite was retrieved with [[discord.Invite.IGetGuildOptions.withCounts]] set to `true`.
     */
    approximateMemberCount: number | null;
  }

  namespace Invite {
    /**
     * Possible options for [[discord.getInvite]].
     */
    interface IGetInviteOptions {
      /**
       * If `true`, the invite will be returned with additional information on the number of members total and online.
       */
      withCounts?: boolean;
    }

    /**
     * Partial guild data present on some invite data.
     */
    type GuildData = {
      /**
       * The id of the [[discord.Guild]].
       */
      id: Snowflake;
      /**
       * The name of the guild.
       */
      name: string;
      /**
       * The splash image hash of the guild, if set.
       */
      splash: string | null;
      /**
       * The icon of the guild, if set. See [[discord.Guild.icon]] for more info.
       */
      icon: string | null;
      /**
       * A list of features available for this guild. See [[discord.Guild.features]] for more info.
       */
      features: Array<discord.Guild.Feature>;
      /**
       * The level of user account verification required to send messages in this guild without a role.
       */
      verificationLevel: discord.Guild.MFALevel;
      /**
       * The vanity url invite code for this guild, if set.
       */
      vanityUrlCode: string | null;
    };

    /**
     * Partial channel data present on channel data.
     */
    type ChannelData = {
      /**
       * The id of the [[discord.Channel]] this data represents.
       */
      id: Snowflake;
      /**
       * The name of the channel.
       */
      name: string;
      /**
       * The type of channel the invite resolves to.
       */
      type: Channel.Type;
    };
  }

  /**
   * A class representing a user's voice state.
   */
  class VoiceState {
    /**
     * The guild id this voice state is targeting.
     */
    guildId: Snowflake;
    /**
     * The id of the [[discord.GuildVoiceChannel]]. If `null`, it indicates the user has disconnected from voice.
     */
    channelId: Snowflake | null;
    /**
     * The id of the [[discord.User]] this voice state applies to.
     */
    userId: Snowflake;
    /**
     * A reference to the [[discord.GuildMember]] this voice state applies to.
     */
    member: GuildMember;
    /**
     * The session id associated with this user's voice connection.
     */
    sessionId?: string;
    /**
     * `true` if the user has been server-deafened.
     *
     * They will not be sent any voice data from other users if deafened.
     */
    deaf: boolean;
    /**
     * `true` if the user has been server-muted.
     *
     * They will not transmit voice data if muted.
     */
    mute: boolean;
    /**
     * `true if the user has opted to deafen themselves via the client.
     *
     * They will not receive or be sent any voice data from other users if deafened.
     */
    selfDeaf: boolean;
    /**
     * `true` if the user has opted to mute their microphone via the client.
     *
     * They will not transmit voice audio if they are self-muted.
     */
    selfMute: boolean;
    /**
     * `true` if the user is currently streaming to the channel using Go Live.
     */
    selfStream: boolean;

    /**
     * Fetches data for the guild associated with this voice state.
     */
    getGuild(): Promise<discord.Guild>;
    /**
     * If `channelId` is not null, will fetch the channel data associated with this voice state.
     */
    getChannel(): Promise<discord.GuildVoiceChannel | null>;
  }

  /**
   * An enumeration of possible Discord events and generic event data interfaces.
   *
   * See [[discord.on]] for more information on registering event handlers.
   */
  namespace Event {
    /**
     * Common event data for [[Event.MESSAGE_DELETE]]. Passed as a parameter when you register an associated event with [[discord.on]].
     */
    interface IMessageDelete {
      /**
       * The id of the deleted message
       */
      id: Snowflake;
      /**
       * The id of the [[discord.TextChannel]] the messages were deleted from.
       */
      channelId: Snowflake;
      /**
       * The id of the [[discord.Guild]] this event occurred in.
       *
       * Note: will be undefined if the event occurred in a DM channel.
       */
      guildId?: Snowflake;
    }

    /**
     * Common event data for [[Event.MESSAGE_DELETE_BULK]]. Passed as a parameter when you register an associated event with [[discord.on]].
     */
    interface IMessageDeleteBulk {
      /**
       * The ids of the deleted messages
       */
      ids: Array<Snowflake>;
      /**
       * The id of the [[discord.TextChannel]] the messages were deleted from.
       */
      channelId: Snowflake;
      /**
       * The id of the [[discord.Guild]] this event occurred in, if any.
       *
       * Note: will be undefined if the event occurred in a DM channel.
       */
      guildId?: Snowflake;
    }

    /**
     * Common event data for [[Event.MESSAGE_REACTION_ADD]]. Passed as a parameter when you register an associated event with [[discord.on]].
     */
    interface IMessageReactionAdd {
      /**
       * The id of the [[discord.User]] that reacted on the message.
       */
      userId: Snowflake;
      /**
       * The id of the [[discord.TextChannel]] the message resides in.
       */
      channelId: Snowflake;
      /**
       * The id of the [[discord.Message]] this event was fired on.
       */
      messageId: Snowflake;
      /**
       * The id of the [[discord.Guild]] this event occurred in, if any.
       *
       * Note: will be undefined if the event occurred in a DM channel.
       */
      guildId?: Snowflake;
      /**
       * An instance of [[discord.GuildMember]] for the user. Requires [[guildId]] to present.
       *
       * Note: will be undefined if the event occurred in a [[discord.DMChannel]].
       */
      member?: GuildMember;
      /**
       * A partial [[discord.Emoji]] instance containing data about the emoji the user reacted with.
       */
      emoji: Partial<Emoji>;
    }

    /**
     * Common event data for [[Event.MESSAGE_REACTION_REMOVE]]. Passed as a parameter when you register an associated event with [[discord.on]].
     */
    interface IMessageReactionRemove {
      /**
       * The id of the [[discord.User]] that removed a reaction on the message.
       */
      userId: Snowflake;
      /**
       * The id of the [[discord.TextChannel]] the message resides in.
       */
      channelId: Snowflake;
      /**
       * The id of the [[discord.Message]] this event was fired on.
       */
      messageId: Snowflake;
      /**
       * The id of the [[discord.Guild]] this event occurred in, if any.
       *
       * Note: will be undefined if the event occurred in a DM channel.
       */
      guildId?: Snowflake;
      /**
       * An instance of [[discord.GuildMember]] for the user. Requires [[guildId]] to present.
       *
       * Note: will be undefined if the event occurred in a [[discord.DMChannel]].
       */
      member?: GuildMember;
      /**
       * A partial [[discord.Emoji]] instance containing data about the emoji the user reacted with.
       */
      emoji: Partial<Emoji>;
    }

    /**
     * Common event data for [[Event.MESSAGE_REACTION_REMOVE_ALL]]. Passed as a parameter when you register an associated event with [[discord.on]].
     */
    interface IMessageReactionRemoveAll {
      /**
       * The id of the [[discord.TextChannel]] the message resides in.
       */
      channelId: Snowflake;
      /**
       * The id of the [[discord.Message]] this event was fired on.
       */
      messageId: Snowflake;
      /**
       * The id of the [[discord.Guild]] this event occurred in, if any.
       *
       * Note: will be undefined if the event occurred in a DM channel.
       */
      guildId?: Snowflake;
    }

    /**
     * Common event data for [[Event.GUILD_MEMBER_REMOVE]]. Passed as a parameter when you register an associated event with [[discord.on]].
     */
    interface IGuildMemberRemove {
      /**
       * The id of the [[discord.Guild]] this event occurred in.
       */
      guildId: Snowflake;
      /**
       * A [[discord.User]] instance containing data about the user that left the guild.
       */
      user: User;
    }

    /**
     * Common event data for [[Event.GUILD_BAN_ADD]]. Passed as a parameter when you register an associated event with [[discord.on]].
     */
    interface IGuildBanAdd {
      /**
       * The id of the [[discord.Guild]] this event occurred in.
       */
      guildId: Snowflake;
      /**
       * A [[discord.User]] instance containing data the newly banned user.
       */
      user: User;
    }

    /**
     * Common event data for [[Event.GUILD_BAN_REMOVE]]. Passed as a parameter when you register an associated event with [[discord.on]].
     */
    interface IGuildBanRemove {
      /**
       * The id of the [[discord.Guild]] this event occurred in.
       */
      guildId: Snowflake;
      /**
       * A [[discord.User]] instance containing data the unbanned user.
       */
      user: User;
    }

    /**
     * Common event data for [[Event.GUILD_EMOJIS_UPDATE]]. Passed as a parameter when you register an associated event with [[discord.on]].
     */
    interface IGuildEmojisUpdate {
      /**
       * The id of the [[discord.Guild]] this event occurred in.
       */
      guildId: Snowflake;
      /**
       * An array of all the [[discord.Emoji]]s this guild contains.
       */
      emojis: Array<Emoji>;
    }

    /**
     * Common event data for [[Event.GUILD_INTEGRATIONS_UPDATE]]. Passed as a parameter when you register an associated event with [[discord.on]].
     */
    interface IGuildIntegrationsUpdate {
      /**
       * The id of the [[discord.Guild]] this event occurred in.
       */
      guildId: Snowflake;
    }

    /**
     * Common event data for [[Event.GUILD_ROLE_CREATE]]. Passed as a parameter when you register an associated event with [[discord.on]].
     */
    interface IGuildRoleCreate {
      /**
       * The id of the [[discord.Guild]] this event occurred in.
       */
      guildId: Snowflake;
      /**
       * An instance of [[discord.Role]] containing data on the created role.
       */
      role: Role;
    }

    /**
     * Common event data for [[Event.GUILD_ROLE_UPDATE]]. Passed as a parameter when you register an associated event with [[discord.on]].
     */
    interface IGuildRoleUpdate {
      /**
       * The id of the [[discord.Guild]] this event occurred in.
       */
      guildId: Snowflake;
      /**
       * An instance of [[discord.Role]] containing updated role data.
       */
      role: Role;
    }

    /**
     * Common event data for [[Event.GUILD_ROLE_DELETE]]. Passed as a parameter when you register an associated event with [[discord.on]].
     */
    interface IGuildRoleDelete {
      /**
       * The id of the [[discord.Guild]] this event occurred in.
       */
      guildId: Snowflake;
      /**
       * The id of the deleted role.
       */
      roleId: Snowflake;
    }

    /**
     * Common event data for [[Event.TYPING_START]]. Passed as a parameter when you register an associated event with [[discord.on]].
     */
    interface ITypingStart {
      /**
       * The id of the [[discord.TextChannel]] this event occurred in.
       */
      channelId: Snowflake;
      /**
       * The id of the [[discord.Guild]] this event occurred in.
       *
       * Note: Will be undefined if the event occurred in a [[discord.DMChannel]].
       */
      guildId?: Snowflake;
      /**
       * The id of the [[discord.User]] that started typing.
       */
      userId: Snowflake;
      /**
       * The unix-epoch timestamp of the time the user started typing.
       */
      timestamp: number;
      /**
       * A [[discord.GuildMember]] instance of the user who started typing.
       *
       * Note: Requires [[guildId]] to be set.
       */
      member?: GuildMember;
    }

    /**
     * Common event data for [[Event.WEBHOOKS_UPDATE]]. Passed as a parameter when you register an associated event with [[discord.on]].
     */
    interface IWebhooksUpdate {
      /**
       * The id of the [[discord.Guild]] this event occurred in.
       */
      guildId: Snowflake;
      /**
       * The id of the [[discord.TextChannel]] this event occurred in.
       */
      channelId: Snowflake;
    }

    /**
     * Common event data for [[Event.CHANNEL_PINS_UPDATE]]. Passed as a parameter when you register an associated event with [[discord.on]].
     */
    interface IChannelPinsUpdate {
      /**
       * The id of the [[discord.Guild]] this event occurred in, if any.
       *
       * Note: Will be undefined if the event occurred in a DM channel.
       */
      guildId?: Snowflake;
      /**
       * The id of the [[discord.TextChannel]] this event occurred in.
       */
      channelId: Snowflake;
      /**
       * The unix-epoch timestamp of the time the user started typing.
       */
      lastPinTimestamp?: string;
    }

    /**
     * Common event data for [[Event.VOICE_SERVER_UPDATE]]. Passed as a parameter when you register an associated event with [[discord.on]].
     */
    interface IVoiceServerUpdate {
      /**
       * Voice connection token.
       */
      token: string;
      /**
       * The id of the [[discord.Guild]] this voice server update is for.
       */
      guildId: Snowflake;
      /**
       * The voice server host.
       */
      endpoint: string;
    }
  }

  /**
   * A enumeration of events to register event handlers for with [[discord.on]].
   */
  const enum Event {
    /**
     * See [[discord.on]] for information on how to register a CHANNEL_CREATE event handler.
     */
    CHANNEL_CREATE = "CHANNEL_CREATE",
    /**
     * See [[discord.on]] for information on how to register a CHANNEL_UPDATE event handler.
     */
    CHANNEL_UPDATE = "CHANNEL_UPDATE",
    /**
     * See [[discord.on]] for information on how to register a CHANNEL_DELETE event handler.
     */
    CHANNEL_DELETE = "CHANNEL_DELETE",
    /**
     * See [[discord.on]] for information on how to register a CHANNEL_PINS_UPDATE event handler.
     */
    CHANNEL_PINS_UPDATE = "CHANNEL_PINS_UPDATE",
    /**
     * See [[discord.on]] for information on how to register a GUILD_CREATE event handler.
     */
    GUILD_CREATE = "GUILD_CREATE",
    /**
     * See [[discord.on]] for information on how to register a GUILD_UPDATE event handler.
     */
    GUILD_UPDATE = "GUILD_UPDATE",
    /**
     * See [[discord.on]] for information on how to register a GUILD_BAN_ADD event handler.
     */
    GUILD_BAN_ADD = "GUILD_BAN_ADD",
    /**
     * See [[discord.on]] for information on how to register a GUILD_BAN_REMOVE event handler.
     */
    GUILD_BAN_REMOVE = "GUILD_BAN_REMOVE",
    /**
     * See [[discord.on]] for information on how to register a GUILD_EMOJIS_UPDATE event handler.
     */
    GUILD_EMOJIS_UPDATE = "GUILD_EMOJIS_UPDATE",
    /**
     * See [[discord.on]] for information on how to register a GUILD_INTEGRATIONS_UPDATE event handler.
     */
    GUILD_INTEGRATIONS_UPDATE = "GUILD_INTEGRATIONS_UPDATE",
    /**
     * See [[discord.on]] for information on how to register a GUILD_MEMBER_ADD event handler.
     */
    GUILD_MEMBER_ADD = "GUILD_MEMBER_ADD",
    /**
     * See [[discord.on]] for information on how to register a GUILD_MEMBER_UPDATE event handler.
     */
    GUILD_MEMBER_UPDATE = "GUILD_MEMBER_UPDATE",
    /**
     * See [[discord.on]] for information on how to register a GUILD_MEMBER_REMOVE event handler.
     */
    GUILD_MEMBER_REMOVE = "GUILD_MEMBER_REMOVE",
    /**
     * See [[discord.on]] for information on how to register a GUILD_ROLE_CREATE event handler.
     */
    GUILD_ROLE_CREATE = "GUILD_ROLE_CREATE",
    /**
     * See [[discord.on]] for information on how to register a GUILD_ROLE_UPDATE event handler.
     */
    GUILD_ROLE_UPDATE = "GUILD_ROLE_UPDATE",
    /**
     * See [[discord.on]] for information on how to register a GUILD_ROLE_DELETE event handler.
     */
    GUILD_ROLE_DELETE = "GUILD_ROLE_DELETE",
    /**
     * See [[discord.on]] for information on how to register a MESSAGE_CREATE event handler.
     */
    MESSAGE_CREATE = "MESSAGE_CREATE",
    /**
     * See [[discord.on]] for information on how to register a MESSAGE_UPDATE event handler.
     */
    MESSAGE_UPDATE = "MESSAGE_UPDATE",
    /**
     * See [[discord.on]] for information on how to register a MESSAGE_DELETE event handler.
     */
    MESSAGE_DELETE = "MESSAGE_DELETE",
    /**
     * See [[discord.on]] for information on how to register a MESSAGE_DELETE_BULK event handler.
     */
    MESSAGE_DELETE_BULK = "MESSAGE_DELETE_BULK",
    /**
     * See [[discord.on]] for information on how to register a MESSAGE_REACTION_ADD event handler.
     */
    MESSAGE_REACTION_ADD = "MESSAGE_REACTION_ADD",
    /**
     * See [[discord.on]] for information on how to register a MESSAGE_REACTION_REMOVE event handler.
     */
    MESSAGE_REACTION_REMOVE = "MESSAGE_REACTION_REMOVE",
    /**
     * See [[discord.on]] for information on how to register a MESSAGE_REACTION_REMOVE_ALL event handler.
     */
    MESSAGE_REACTION_REMOVE_ALL = "MESSAGE_REACTION_REMOVE_ALL",
    /**
     * See [[discord.on]] for information on how to register a TYPING_START event handler.
     */
    TYPING_START = "TYPING_START",
    /**
     * See [[discord.on]] for information on how to register a USER_UPDATE event handler.
     */
    USER_UPDATE = "USER_UPDATE",
    /**
     * See [[discord.on]] for information on how to register a VOICE_STATE_UPDATE event handler.
     */
    VOICE_STATE_UPDATE = "VOICE_STATE_UPDATE",
    /**
     * See [[discord.on]] for information on how to register a VOICE_SERVER_UPDATE event handler.
     */
    VOICE_SERVER_UPDATE = "VOICE_SERVER_UPDATE",
    /**
     * See [[discord.on]] for information on how to register a WEBHOOKS_UPDATE event handler.
     */
    WEBHOOKS_UPDATE = "WEBHOOKS_UPDATE",
  }

  /**
   * Fired when new messages are sent in any channel the current bot can read.
   *
   * #### Example: Log all messages to the developer console, and respond to "foo" with "bar".
   * ```ts
   * discord.on("MESSAGE_CREATE", async (message) => {
   *   console.log(message);
   *
   *   if (message.content === "foo") {
   *     await message.reply("bar");
   *   }
   * });
   * ```
   *
   * Note: If you want to create commands, please make use of the command handlers found in [[discord.command]].
   *
   * Note: MESSAGE_CREATE events will not be fired for messages sent by the bot itself.
   *
   * @event
   */
  function on(
    event: Event.MESSAGE_CREATE | "MESSAGE_CREATE",
    handler: (message: Message.AnyMessage) => Promise<unknown>
  ): void;

  /**
   * Fired when a message is edited or otherwise updated.
   *
   * Note: This event is fired for messages containing embedded links when the unfurl is complete. In this case, the new message object contains the unfurled embed.
   * If you want to see if a user edited a message's content, diff the [[Message.content]] property.
   *
   * @event
   */
  function on(
    event: Event.MESSAGE_UPDATE | "MESSAGE_UPDATE",
    handler: (
      message: Message.AnyMessage,
      oldMessage: Message.AnyMessage | null
    ) => Promise<unknown>
  ): void;

  /**
   * Fired when a message is deleted from a channel.
   *
   * If the message data pre-deletion was cached, it will be returned as the second parameter to the handler.
   *
   * @event
   */
  function on(
    event: Event.MESSAGE_DELETE | "MESSAGE_DELETE",
    handler: (
      event: Event.IMessageDelete,
      oldMessage: Message.AnyMessage | null
    ) => Promise<unknown>
  ): void;

  /**
   * Fired when a message is deleted from a channel.
   *
   * If the message data pre-deletion was cached, it will be returned as the second parameter to the handler.
   *
   * @event
   */
  function on(
    event: Event.MESSAGE_DELETE_BULK | "MESSAGE_DELETE_BULK",
    handler: (event: Event.IMessageDeleteBulk) => Promise<unknown>
  ): void;

  /**
   * Fired when a reaction is added to a message.
   *
   * @event
   */
  function on(
    event: Event.MESSAGE_REACTION_ADD | "MESSAGE_REACTION_ADD",
    handler: (event: Event.IMessageReactionAdd) => Promise<unknown>
  ): void;

  /**
   * Fired when a user's reaction is removed from a message
   *
   * @event
   */
  function on(
    event: Event.MESSAGE_REACTION_REMOVE | "MESSAGE_REACTION_REMOVE",
    handler: (event: Event.IMessageReactionRemove) => Promise<unknown>
  ): void;

  /**
   * Fired when all reactions on a message are removed at once.
   *
   * @event
   */
  function on(
    event: Event.MESSAGE_REACTION_REMOVE_ALL | "MESSAGE_REACTION_REMOVE_ALL",
    handler: (event: Event.IMessageReactionRemoveAll) => Promise<unknown>
  ): void;

  /**
   * Fired when a bot is invited to a guild, or after the shard serving this guild reconnects to the Discord gateway.
   *
   * @event
   */
  function on(
    event: Event.GUILD_CREATE | "GUILD_CREATE",
    handler: (guild: Guild) => Promise<unknown>
  ): void;

  /**
   * Fired when [[discord.Guild]] settings are updated, or when a guild's availability changes.
   *
   * @event
   */
  function on(
    event: Event.GUILD_UPDATE | "GUILD_UPDATE",
    handler: (guild: Guild, oldGuild: Guild) => Promise<unknown>
  ): void;

  /**
   * Fired when a new [[discord.GuildMember]] is added to a [[discord.Guild]].
   *
   * @event
   */
  function on(
    event: Event.GUILD_MEMBER_ADD | "GUILD_MEMBER_ADD",
    handler: (member: GuildMember) => Promise<unknown>
  ): void;

  /**
   * Fired when a [[discord.GuildMember]] leaves a [[discord.Guild]].
   *
   * @event
   */
  function on(
    event: Event.GUILD_MEMBER_REMOVE | "GUILD_MEMBER_REMOVE",
    handler: (member: Event.IGuildMemberRemove, oldMember: GuildMember) => Promise<unknown>
  ): void;

  /**
   * Fired when one of the following events regarding a [[discord.GuildMember]] occur:
   * - A guild member changes their username, avatar, or discriminator
   * - A guild member updates their guild nickname
   * - A role is added or removed from a GuildMember
   * - The user starts boosting the guild
   *
   * @event
   */
  function on(
    event: Event.GUILD_MEMBER_UPDATE | "GUILD_MEMBER_UPDATE",
    handler: (member: GuildMember, oldMember: GuildMember) => Promise<unknown>
  ): void;

  /**
   * Fired when a [[discord.GuildMember]] is banned from a [[discord.Guild]].
   *
   * @event
   */
  function on(
    event: Event.GUILD_BAN_ADD | "GUILD_BAN_ADD",
    handler: (event: Event.IGuildBanAdd) => Promise<unknown>
  ): void;

  /**
   * Fired when a [[discord.GuildMember]] is unbanned from a [[discord.Guild]].
   *
   * @event
   */
  function on(
    event: Event.GUILD_BAN_REMOVE | "GUILD_BAN_REMOVE",
    handler: (event: Event.IGuildBanRemove) => Promise<unknown>
  ): void;

  /**
   * Fired when the list of [[discord.Emoji]]s on a guild is updated.
   *
   * The second parameter in the event contains a structure with the list of emojis previously assigned to this guild.
   *
   * @event
   */
  function on(
    event: Event.GUILD_EMOJIS_UPDATE | "GUILD_EMOJIS_UPDATE",
    handler: (
      event: Event.IGuildEmojisUpdate,
      oldEvent: Event.IGuildEmojisUpdate
    ) => Promise<unknown>
  ): void;

  /**
   * Fired when integrations (twitch/youtube subscription sync) are updated for a [[discord.Guild]]
   *
   * @event
   */
  function on(
    event: Event.GUILD_INTEGRATIONS_UPDATE | "GUILD_INTEGRATIONS_UPDATE",
    handler: (event: Event.IGuildIntegrationsUpdate) => Promise<unknown>
  ): void;
  /**
   * Fired when a [[discord.Role]] is created.
   *
   * @event
   */
  function on(
    event: Event.GUILD_ROLE_CREATE | "GUILD_ROLE_CREATE",
    handler: (event: Event.IGuildRoleCreate) => Promise<unknown>
  ): void;

  /**
   * Fired when a [[discord.Role]] is created.
   *
   * @event
   */
  function on(
    event: Event.GUILD_ROLE_UPDATE | "GUILD_ROLE_UPDATE",
    handler: (event: Event.IGuildRoleUpdate, oldRole: discord.Role) => Promise<unknown>
  ): void;

  /**
   * Fired when a [[discord.Role]] is deleted.
   *
   * @event
   */
  function on(
    event: Event.GUILD_ROLE_DELETE | "GUILD_ROLE_DELETE",
    handler: (event: Event.IGuildRoleDelete, oldRole: discord.Role) => Promise<unknown>
  ): void;

  /**
   * Fired when a [[discord.GuildChannel]] is created, or a new [[discord.DMChannel]] is opened.
   *
   * @event
   */
  function on(
    event: Event.CHANNEL_CREATE | "CHANNEL_CREATE",
    handler: (channel: Channel.AnyChannel) => Promise<unknown>
  ): void;

  /**
   * Fired when a [[discord.Channel]] is updated.
   *
   * @event
   */
  function on(
    event: Event.CHANNEL_UPDATE | "CHANNEL_UPDATE",
    handler: (
      channel: discord.Channel.AnyChannel,
      oldChannel: discord.Channel.AnyChannel
    ) => Promise<unknown>
  ): void;

  /**
   * Fired when a [[discord.Channel]] channel is deleted.
   *
   * @event
   */
  function on(
    event: Event.CHANNEL_DELETE | "CHANNEL_DELETE",
    handler: (channel: discord.Channel.AnyChannel) => Promise<unknown>
  ): void;

  /**
   * Fired when a Message Pin is added or removed from a [[discord.Channel]].
   *
   * @event
   */
  function on(
    event: Event.CHANNEL_PINS_UPDATE | "CHANNEL_PINS_UPDATE",
    handler: (event: Event.IChannelPinsUpdate) => Promise<unknown>
  ): void;

  /**
   * Fired when the [[discord.VoiceState]] of a [[discord.GuildMember]] is updated.
   *
   * This event is fired when a user connects to voice, switches voice channels, or disconnects from voice.
   * Additionally, this event is fired when a user mutes or deafens, or when server muted/deafened.
   *
   * @event
   */
  function on(
    event: Event.VOICE_STATE_UPDATE | "VOICE_STATE_UPDATE",
    handler: (voiceState: VoiceState, oldVoiceState: VoiceState) => Promise<unknown>
  ): void;

  /**
   * Fired when Discord finishes preparing a voice server session for the current bot user.
   *
   * Note: This SDK currently offers no utilities to send or receive voice data.
   * You can use the token and server address to negotiate the connection yourself.
   *
   * @event
   */
  function on(
    event: Event.VOICE_SERVER_UPDATE | "VOICE_SERVER_UPDATE",
    handler: (event: Event.IVoiceServerUpdate) => Promise<unknown>
  ): void;

  /**
   * Fired when Discord finishes preparing a voice server session for the current bot user.
   *
   * Note: This SDK currently offers no utilities to send or receive voice data.
   * You can use the token and server address to negotiate the connection yourself.
   *
   * @event
   */
  function on(
    event: Event.TYPING_START | "TYPING_START",
    handler: (event: Event.ITypingStart) => Promise<unknown>
  ): void;

  /**
   * Fired when Discord finishes preparing a voice server session for the current bot user.
   *
   * Note: This SDK currently offers no utilities to send or receive voice data.
   * You can use the token and server address to negotiate the connection yourself.
   *
   * @event
   */
  function on(
    event: Event.WEBHOOKS_UPDATE | "WEBHOOKS_UPDATE",
    handler: (event: Event.IWebhooksUpdate) => Promise<unknown>
  ): void;

  /**
   * Fired when the current bot's [[discord.User]] object changes
   *
   * @event
   */
  function on(
    event: Event.USER_UPDATE | "USER_UPDATE",
    handler: (event: User) => Promise<unknown>
  ): void;

  /**
   * Registers a Promise to be resolved when an event of the given [[discord.Event]] type is received.
   *
   * Alias of [[discord.on]].
   *
   * Note: Event handlers must be statically registered at the start of the script.
   *
   * Note: Some event handlers pass two parameters to the handlers, usually with a snapshot of the event object before updating the cache.
   * This is useful for finding what changed within objects after on and delete events.
   *
   * @deprecated Use [[discord.on]] instead
   * @event
   */
  const registerEventHandler: typeof discord.on;

  /**
   * Fetches a [[discord.User]] object containing information about a user on Discord.
   *
   * @param userId The user id (snowflake) you want to fetch data for.
   */
  function getUser(userId: discord.Snowflake): Promise<discord.User | null>;

  /**
   * Fetches a [[discord.Invite]] object containing information about an invite on Discord.
   *
   * @param code The invite's code (example: `hC6Bbtj` from https://discord.gg/hC6Bbtj)
   */
  function getInvite(
    code: string,
    options?: Invite.IGetInviteOptions
  ): Promise<discord.Invite | null>;

  /**
   * Returns the [[discord.Snowflake]] ID for the current bot user the script is running on.
   */
  function getBotId(): discord.Snowflake;

  /**
   * Fetches a [[discord.User]] object containing information about the bot user the script is running on.
   */
  function getBotUser(): Promise<discord.User>;

  /**
   * Fetches a [[discord.Guild]] object for a given Discord server/guild id.
   *
   * Note: You can only fetch data for the Guild the bot is currently active on.
   *
   * @param guildId The guild id (snowflake) you want to fetch guild data for.
   */
  function getGuild(guildId: discord.Snowflake): Promise<discord.Guild | null>;

  /**
   * Fetches a [[discord.Channel]] (or more specific child) object for a given Discord channel id.
   *
   * Note: You can only fetch channels within the script's active guild.
   *
   * @param channelId The channel id (snowflake) you want to fetch channel data for.
   */
  function getChannel(channelId: discord.Snowflake): Promise<discord.Channel.AnyChannel | null>;

  /**
   * The built-in Pylon command handler. Provides utilities for building a bot that handles commands.
   *
   * You can of course roll your own if you want, using the [[discord.Event.MESSAGE_CREATE]] event handler.
   */
  namespace command {
    /**
     * Filters allow you to constrain who is able to run a given [[discord.command.CommandGroup]] or [[discord.command.Command]].
     */
    namespace filters {
      type CommandFilterCriteria =
        | string
        | { name: string; children: Array<CommandFilterCriteria> };
      interface ICommandFilter {
        filter(message: discord.GuildMemberMessage): Promise<boolean>;
        getCriteria(): Promise<CommandFilterCriteria | null>;
      }

      /**
       * Only allow the command to be run if the user has the [[discord.Permissions.ADMINISTRATOR]] permission.
       */
      function isAdministrator(): ICommandFilter;

      /**
       * Only allow the command to be run by the current guild owner.
       */
      function isOwner(): ICommandFilter;

      /**
       * Only allows the command to be run by a specified `userId`.
       */
      function isUserId(userId: discord.Snowflake): ICommandFilter;

      /**
       * Only allows the command to be run by the specified `userIds`.
       */
      function userIdIn(userIds: Array<discord.Snowflake>): ICommandFilter;

      /**
       * Only allows the command to be run in a specified `channelId`.
       */
      function isChannelId(channelId: discord.Snowflake): ICommandFilter;

      /**
       * Only allows the command to be run in the specified `channelIds`.
       */
      function channelIdIn(channelIds: Array<discord.Snowflake>): ICommandFilter;

      /**
       * Only allows the command to be run in a channel which has the specified `parentId`.
       */
      function hasParentId(parentId: discord.Snowflake): ICommandFilter;

      /**
       * Only allows the command to be run in a channel which has the specified `parentIds`.
       */
      function parentIdIn(parentIds: Array<discord.Snowflake>): ICommandFilter;

      /**
       * Only allows the command to be run in a channel which is marked nsfw.
       */
      function isChannelNsfw(): ICommandFilter;

      /**
       * Only allows the command to be run if the user has the [[discord.Permissions.CREATE_INSTANT_INVITE]] permission.
       */
      function canCreateInstantInvite(channelId?: discord.Snowflake): ICommandFilter;

      /**
       * Only allows the command to be run if the user has the [[discord.Permissions.KICK_MEMBERS]] permission.
       */
      function canKickMembers(): ICommandFilter;

      /**
       * Only allows the command to be run if the user has the [[discord.Permissions.BAN_MEMBERS]] permission.
       */
      function canBanMembers(): ICommandFilter;

      /**
       * Only allows the command to be run if the user has the [[discord.Permissions.MANAGE_CHANNELS]] permission.
       *
       * By default, will check for the permission in the current channel that the command is being invoked in. However,
       * you can specify a specific `channelId` as an optional argument, that will override the channel that the permission
       * will be checked in.
       */
      function canManageChannels(channelId?: discord.Snowflake): ICommandFilter;

      /**
       * Only allows the command to be run if the user has the [[discord.Permissions.MANAGE_GUILD]] permission.
       */
      function canManageGuild(): ICommandFilter;

      /**
       * Only allows the command to be run if the user has the [[discord.Permissions.ADD_REACTIONS]] permission.
       *
       * By default, will check for the permission in the current channel that the command is being invoked in. However,
       * you can specify a specific `channelId` as an optional argument, that will override the channel that the permission
       * will be checked in.
       */
      function canAddReactions(channelId?: discord.Snowflake): ICommandFilter;

      /**
       * Only allows the command to be run if the user has the [[discord.Permissions.VIEW_AUDIT_LOGS]] permission.
       */
      function canViewAuditLog(): ICommandFilter;

      /**
       * Only allows the command to be run if the user has the [[discord.Permissions.SEND_TTS_MESSAGES]] permission.
       *
       * By default, will check for the permission in the current channel that the command is being invoked in. However,
       * you can specify a specific `channelId` as an optional argument, that will override the channel that the permission
       * will be checked in.
       */
      function canSendTtsMessages(channelId?: discord.Snowflake): ICommandFilter;

      /**
       * Only allows the command to be run if the user has the [[discord.Permissions.MANAGE_MESSAGES]] permission.
       *
       * By default, will check for the permission in the current channel that the command is being invoked in. However,
       * you can specify a specific `channelId` as an optional argument, that will override the channel that the permission
       * will be checked in.
       */
      function canManageMessages(channelId?: discord.Snowflake): ICommandFilter;

      /**
       * Only allows the command to be run if the user has the [[discord.Permissions.EMBED_LINKS]] permission.
       *
       * By default, will check for the permission in the current channel that the command is being invoked in. However,
       * you can specify a specific `channelId` as an optional argument, that will override the channel that the permission
       * will be checked in.
       */
      function canEmbedLinks(channelId?: discord.Snowflake): ICommandFilter;

      /**
       * Only allows the command to be run if the user has the [[discord.Permissions.ATTACH_FILES]] permission.
       *
       * By default, will check for the permission in the current channel that the command is being invoked in. However,
       * you can specify a specific `channelId` as an optional argument, that will override the channel that the permission
       * will be checked in.
       */
      function canAttachFiles(channelId?: discord.Snowflake): ICommandFilter;

      /**
       * Only allows the command to be run if the user has the [[discord.Permissions.MENTION_EVERYONE]] permission.
       *
       * By default, will check for the permission in the current channel that the command is being invoked in. However,
       * you can specify a specific `channelId` as an optional argument, that will override the channel that the permission
       * will be checked in.
       */
      function canMentionEveryone(channelId?: discord.Snowflake): ICommandFilter;

      /**
       * Only allows the command to be run if the user has the [[discord.Permissions.EXTERNAL_EMOJIS]] permission.
       *
       * By default, will check for the permission in the current channel that the command is being invoked in. However,
       * you can specify a specific `channelId` as an optional argument, that will override the channel that the permission
       * will be checked in.
       */
      function canUseExternalEmojis(channelId?: discord.Snowflake): ICommandFilter;

      /**
       * Only allows the command to be run if the user has the [[discord.Permissions.VIEW_GUILD_ANALYTICS]] permission.
       */
      function canViewGuildInsights(): ICommandFilter;

      /**
       * Only allows the command to be run if the user has the [[discord.Permissions.VOICE_MUTE_MEMBERS]] permission.
       *
       * By default, will check for the permission in the current channel that the command is being invoked in. However,
       * you can specify a specific `channelId` as an optional argument, that will override the channel that the permission
       * will be checked in.
       */
      function canMuteMembers(channelId?: discord.Snowflake): ICommandFilter;

      /**
       * Only allows the command to be run if the user has the [[discord.Permissions.VOICE_DEAFEN_MEMBERS]] permission.
       *
       * By default, will check for the permission in the current channel that the command is being invoked in. However,
       * you can specify a specific `channelId` as an optional argument, that will override the channel that the permission
       * will be checked in.
       */
      function canDeafenMembers(channelId?: discord.Snowflake): ICommandFilter;

      /**
       * Only allows the command to be run if the user has the [[discord.Permissions.VOICE_MOVE_MEMBERS]] permission.
       *
       * By default, will check for the permission in the current channel that the command is being invoked in. However,
       * you can specify a specific `channelId` as an optional argument, that will override the channel that the permission
       * will be checked in.
       */
      function canMoveMembers(channelId?: discord.Snowflake): ICommandFilter;

      /**
       * Only allows the command to be run if the user has the [[discord.Permissions.STREAM]] permission. Streaming is also known
       * as the "go live" feature inside of Discord.
       *
       * By default, will check for the permission in the current channel that the command is being invoked in. However,
       * you can specify a specific `channelId` as an optional argument, that will override the channel that the permission
       * will be checked in.
       */
      function canStream(channelId?: discord.Snowflake): ICommandFilter;

      /**
       * Only allows the command to be run if the user has the [[discord.Permissions.CHANGE_NICKNAME]] permission.
       *
       * This differs from [[discord.command.filters.canManageNicknames]] in that the [[discord.Permissions.CHANGE_NICKNAME]] permission only
       * allows the user to change their own username, and not the username of others. This means that this filter checks if the user
       * can change their own nickname.
       */
      function canChangeNickname(): ICommandFilter;

      /**
       * Only allows the command to be run if the user has the [[discord.Permissions.MANAGE_NICKNAMES]] permission.
       */
      function canManageNicknames(): ICommandFilter;

      /**
       * Only allows the command to be run if the user has the [[discord.Permissions.MANAGE_ROLES]] permission.
       */
      function canManageRoles(): ICommandFilter;

      /**
       * Only allows the command to be run if the user has the [[discord.Permissions.MANAGE_WEBHOOKS]] permission.
       *
       * This differs from [[discord.command.filters.canManageChannelWebhooks]] in that, this permission checks if they
       * can manage all webhooks on the guild, rather than webhooks within a specific channel.
       */
      function canManageGuildWebhooks(): ICommandFilter;

      /**
       * Only allows the command to be run if the user has the [[discord.Permissions.MANAGE_WEBHOOKS]] permission.
       *
       * By default, will check for the permission in the current channel that the command is being invoked in. However,
       * you can specify a specific `channelId` as an optional argument, that will override the channel that the permission
       * will be checked in.
       */
      function canManageChannelWebhooks(channelId?: discord.Snowflake): ICommandFilter;

      /**
       * Only allows the command to be run if the user has the [[discord.Permissions.MANAGE_EMOJIS]] permission.
       */
      function canManageEmojis(): ICommandFilter;

      /**
       * Only allows the command to be run if the user has the [[discord.Permissions.VOICE_CONNECT]] permission.
       *
       * By default, will check for the permission in the current channel that the command is being invoked in. However,
       * you can specify a specific `channelId` as an optional argument, that will override the channel that the permission
       * will be checked in.
       *
       * Note: Since commands are generally executed in text channels, without a `channelId` provided, this checks to see
       * if the user is able to connect to channels without any specific permission overrides.
       */
      function canConnect(channelId?: discord.Snowflake): ICommandFilter;

      /**
       * Only allows the command to be run if the user has the [[discord.Permissions.VOICE_SPEAK]] permission.
       *
       * By default, will check for the permission in the current channel that the command is being invoked in. However,
       * you can specify a specific `channelId` as an optional argument, that will override the channel that the permission
       * will be checked in.
       *
       * Note: Since commands are generally executed in text channels, without a `channelId` provided, this checks to see
       * if the user is able to speak in channels without any specific permission overrides.
       */
      function canSpeak(channelId?: discord.Snowflake): ICommandFilter;

      /**
       * Only allows the command to be run if the user has the [[discord.Permissions.VOICE_PRIORITY_SPEAKER]] permission.
       *
       * By default, will check for the permission in the current channel that the command is being invoked in. However,
       * you can specify a specific `channelId` as an optional argument, that will override the channel that the permission
       * will be checked in.
       *
       * Note: Since commands are generally executed in text channels, without a `channelId` provided, this checks to see
       * if the user is able to speak with priority in channels without any specific permission overrides.
       */
      function canPrioritySpeaker(channelId?: discord.Snowflake): ICommandFilter;

      /**
       * Only allows the command to be run if the user has the [[discord.Permissions.VOICE_USE_VAD]] permission.
       *
       * By default, will check for the permission in the current channel that the command is being invoked in. However,
       * you can specify a specific `channelId` as an optional argument, that will override the channel that the permission
       * will be checked in.
       *
       * Note: Since commands are generally executed in text channels, without a `channelId` provided, this checks to see
       * if the user is able to speak using voice activity detection in channels without any specific permission overrides.
       */
      function canUseVoiceActivity(channelId?: discord.Snowflake): ICommandFilter;

      /**
       * Only allows the command to be run if the user has the [[discord.Permissions.READ_MESSAGES]] permission in a given channel.
       *
       * Note: This filter always takes a `channelId`, as it's implied that the user has the read message permission in the current channel
       * if they're able to execute a command in that channel. This allows you to check if the user is able to read messages in another
       * channel.
       */
      function canReadMessages(channelId: discord.Snowflake): ICommandFilter;

      /**
       * Only allows the command to be run if the user has the [[discord.Permissions.READ_MESSAGE_HISTORY]] permission.
       *
       * By default, will check for the permission in the current channel that the command is being invoked in. However,
       * you can specify a specific `channelId` as an optional argument, that will override the channel that the permission
       * will be checked in.
       */
      function canReadMessageHistory(channelId?: discord.Snowflake): ICommandFilter;

      /**
       * Only allows the command to be run if the user has the [[discord.Permissions.SEND_MESSAGES]] permission in a given channel.
       *
       * Note: This filter always takes a `channelId`, as it's implied that the user has the send message permission in the current channel
       * if they're able to execute a command in that channel. This allows you to check if the user is able to send messages in another
       * channel.
       */
      function canSendMessages(channelId: discord.Snowflake): ICommandFilter;

      /**
       * Only allows the command to be run if the user has the given `permission` in the guild.
       *
       * This is a lower level function of the `can...` functions located in this module. For example, the following
       * are equivalent:
       *  - `discord.command.filters.canManageGuild()`
       *  - `discord.command.filters.hasGuildPermission(discord.Permissions.MANAGE_GUILD)`
       */
      function hasGuildPermission(permission: discord.Permissions): ICommandFilter;

      /**
       * Only allows the command to be run if the user has the given `permission` in the given `channelId`. If the `channelId`
       * is not provided, will check to see if they have the given permission in the current channel.
       *
       * This is a lower level function of the `can...` functions located in this module. For example, the following
       * are equivalent:
       *  - `discord.command.filters.hasChannelPermission()`
       *  - `discord.command.filters.hasChannelPermission(discord.Permissions.MANAGE_MESSAGES)`
       */
      function hasChannelPermission(
        permission: discord.Permissions,
        channelId?: discord.Snowflake
      ): ICommandFilter;

      /**
       * Only allows the command to run if the user has one of the specified `roles`.
       *
       * Note: Providing an empty `roles` array will cause the script to fail validation.
       */
      function hasSomeRole(roles: Array<discord.Snowflake>): ICommandFilter;

      /**
       * Only allows the command to run if the user has all of the specified `roles`.
       *
       * Note: Providing an empty `roles` array will cause the script to fail validation.
       */
      function hasEveryRole(roles: Array<discord.Snowflake>): ICommandFilter;

      /**
       * Only allows the command to run if the user has a given `role`.
       *
       * Note: This is basically equivalent to `discord.command.filters.hasSomeRole([role])`. But with a more
       * specialized error message. Internally, if `hasSomeRole` or `hasEveryRole` is called with a single
       * role id, it will use this function instead.
       */
      function hasRole(role: discord.Snowflake): ICommandFilter;

      /**
       * Only allows the command to be run if the user has a role that is mentionable by everyone.
       */
      function hasMentionableRole(): ICommandFilter;

      /**
       * Only allows the command to be run if the user has a nickname in the guild.
       */
      function hasNickname(): ICommandFilter;

      /**
       * Combines multiple filters into a single filter, only allowing the command to be run if all the
       * filters provided allow the command to be run.
       *
       * #### Example:
       *
       * Only allow the command to be ran in a specific channel by administrators.
       *
       * ```ts
       * const F = discord.command.filters;
       * const ADMIN_CHANNEL_ID = '628887548604841984';
       *
       * const commands = new discord.command.CommandGroup();
       * commands.raw(
       *   {
       *     name: 'admin',
       *     filters: F.and(F.isChannelId(ADMIN_CHANNEL_ID), F.isAdministrator())
       *   },
       *   (message) => message.reply('hey!')
       * );
       * ```
       */
      function and(...filters: ICommandFilter[]): ICommandFilter;

      /**
       * Combines multiple filters into a single filter, only allowing the command to be run if one of the
       * filters provided allow the command to be run.
       *
       * #### Example:
       *
       * Only allow the command to be ran in a specific channel, or if the user is an administrator.
       * ```ts
       * const F = discord.command.filters;
       *
       * const commands = new discord.command.CommandGroup();
       * commands.raw(
       *   {
       *     name: 'hey',
       *     filters: F.or(F.isChannelId(CHANNEL_ID), F.isAdministrator())
       *   },
       *   (message) => message.reply('hey!')
       * );
       * ```
       */
      function or(...filters: ICommandFilter[]): ICommandFilter;

      /**
       * Creates a filter that is the inverse of a given filter.
       *
       * #### Example:
       *
       * Only allows the command to be ran if the user is NOT an administrator.
       * ```ts
       * const F = discord.command.filters;
       *
       * const commands = new discord.command.CommandGroup();
       * commands.raw(
       *   {
       *     name: 'hey',
       *     filters: F.not(F.isAdministrator())
       *   },
       *   (message) => message.reply('hey!')
       * );
       * ```
       */
      function not(filter: ICommandFilter): ICommandFilter;

      /**
       * Suppresses the error message returned by a given filter if the user does not meet
       * its criteria.
       *
       * This is really useful in combination with the [[discord.command.filters.isChannelId]] filter (see below).
       *
       * #### Example:
       *
       * Limits a command group to only be usable in a given channel. If the user is not in that channel, and tries
       * to use a command, don't allow it to be used, but also don't tell them which channel they need to be in. For
       * example, if you had an game channel that you wanted to run game commands in:
       *
       * ```ts
       * const F = discord.command.filters;
       * const GAME_CHANNEL_ID = '628887548604841984';
       * const gameCommands = new discord.command.CommandGroup({
       *   filters: F.silent(F.isChannelId(GAME_CHANNEL_ID))
       * });
       * gameCommands.raw('d6', (message) =>
       *   message.reply(`Your roll is ${(Math.random() * 6) | 0}`)
       * );
       * gameCommands.raw('flip', (message) =>
       *   message.reply(`Coin flip is ${Math.random() < 0.5 ? 'heads' : 'tails'}!`)
       * );
       * ```
       */
      function silent(filter: ICommandFilter): ICommandFilter;

      // TODO: when guild.getVoiceState(userId) exists.
      // function connectedToVoiceChannel(): ICommandFilter;
      // function connectedToSomeVoiceChannel(...channelIds: discord.Snowflake[]): ICommandFilter;
      // function isLive(channelId?: discord.Snowflake): ICommandFilter;

      /**
       * Wraps a given `filter`, making it return a custom criteria message instead of the one provided. This can
       * add some flavor to your bot by letting you override the built in Pylon filter criteria message.
       *
       * #### Example:
       *
       * Wrap the [[discord.command.filter.isAdministrator]] filter, providing a custom criteria message if the
       * user is not an administrator.
       *
       * ```ts
       * const F = discord.command.filters;
       * // You can now use `coolerAdminFilter` with your commands. You of course don't need to assign this
       * // to a variable. But if you've gone through the effort of making a cool criteria message, you
       * // might want to reuse it.
       * const coolerAdminFilter = F.withCustomMessage(F.isAdministrator, "be an incredibly cool person");
       * ```
       */
      function withCustomMessage(
        filter: ICommandFilter,
        filterCriteria: string | (() => Promise<string> | string)
      ): ICommandFilter;

      /**
       * Creates a custom filter, based upon whatever criteria you wish. Additionally, you can provide a custom criteria
       * message.
       *
       * #### Example:
       *
       * Checks to see if the user's discriminator is #0001.
       * ```ts
       * const is0001Discriminator = discord.command.filters.custom(
       *  (message) => message.author.discriminator === '0001',
       *  'discriminator must be #0001'
       * );
       * ```
       * */
      function custom(
        filter: (message: discord.GuildMemberMessage) => Promise<boolean> | boolean,
        filterCriteria?: string | (() => Promise<string> | string)
      ): ICommandFilter;
    }

    class ArgumentError<T> extends Error {
      public argumentConfig: IArgumentConfig<T>;
    }

    class Command {
      // getHelpString(): string;
      // getCommandPrefix(): string;
    }

    /**
     * A type union of the string representations available as an argument type.
     */
    type ArgumentType =
      | "string"
      | "stringOptional"
      | "integer"
      | "integerOptional"
      | "number"
      | "numberOptional"
      | "text"
      | "textOptional"
      | "stringList"
      | "stringListOptional"
      | "user"
      | "userOptional"
      | "guildMember"
      | "guildMemberOptional";

    /**
     * A type union containing possible resolved argument types.
     */
    type ArgumentTypeTypes = string | number | string[] | discord.User | discord.GuildMember;

    /**
     * A type union containing possible options passed to an argument.
     */
    type ArgumentOptions<T> =
      | discord.command.IArgumentOptions
      | discord.command.IOptionalArgumentOptions<T>
      | undefined;

    interface IArgumentConfig<T> {
      /**
       * The type definition of the JS value this argument will represent.
       */
      type: ArgumentType;
      /**
       * Options for this argument.
       */
      options: ArgumentOptions<T>;
    }

    interface IArgumentOptions {
      /**
       * A human-readable custom name for this argument.
       */
      name?: string;
      /**
       * A human-readable description for this argument.
       */
      description?: string;
    }

    interface IOptionalArgumentOptions<T> extends IArgumentOptions {
      /**
       * Optional arguments allow you to specify a default.
       * Otherwise, a missing optional argument will resolve as null.
       */
      default: T;
    }

    interface ICommandArgs {
      /**
       * Parses a single space-delimited argument as a string.
       * @param options argument config
       */
      string(options?: IArgumentOptions): string;

      /**
       * Optionally parses a single space-delimited argument as a string.
       * @param options argument config
       */
      stringOptional(options: IOptionalArgumentOptions<string>): string;
      stringOptional(options?: IArgumentOptions): string | null;

      /**
       * Parses a single space-delimited argument with parseInt()
       * Non-numeric inputs will cause the command to error. Floating point inputs are truncated.
       * @param options argument config
       */
      integer(options?: IArgumentOptions): number;
      /**
       * Optionally parses a single space-delimited argument with parseInt()
       * Non-numeric inputs will cause the command to error. Floating point inputs are truncated.
       * @param options argument config
       */
      integerOptional(options: IOptionalArgumentOptions<number>): number;
      integerOptional(options?: IArgumentOptions): number | null;

      /**
       * Parses a single space-delimited argument with parseFloat()
       * Non-numeric inputs will cause the command to error.
       * @param options argument config
       */
      number(options?: IArgumentOptions): number;
      /**
       * Optionally parses a single space-delimited argument with parseFloat()
       * Non-numeric inputs will cause the command to error.
       * @param options argument config
       */
      numberOptional(options: IOptionalArgumentOptions<number>): number;
      numberOptional(options?: IArgumentOptions): number | null;

      /**
       * Parses the rest of the command's input as a string, leaving no more content for any future arguments.
       * If used, this argument must appear as the last argument in your command handler.
       * @param options argument config
       */
      text(options?: IArgumentOptions): string;
      /**
       * Optionally parses the rest of the command's input as a string, leaving no more content for any future arguments.
       * If used, this argument must appear as the last argument in your command handler.
       * @param options argument config
       */
      textOptional(options: IOptionalArgumentOptions<string>): string;
      textOptional(options?: IArgumentOptions): string | null;

      /**
       * Parses the rest of the command's input as space-delimited string values.
       * If used, this argument must appear as the last argument in your command handler.
       * @param options argument config
       */
      stringList(options?: IArgumentOptions): string[];
      /**
       * Optionally parses the rest of the command's input as space-delimited string values.
       * If used, this argument must appear as the last argument in your command handler.
       * @param options argument config
       */
      stringListOptional(options: IOptionalArgumentOptions<string[]>): string[];
      stringListOptional(options?: IArgumentOptions): string[] | null;

      /**
       * Parses a mention string or user id and resolves a [[discord.User]] object reference.
       * If the user was not found, the command will error.
       * @param options argument config
       */
      user(options?: IArgumentOptions): Promise<discord.User>;

      /**
       * Optionally parses a mention string or user id and resolves a [[discord.User]] object reference.
       * If the argument is present but the user was not found, the command will error.
       * Like all optional arguments, if the argument is not present the value will be resolved as null.
       * @param options argument config
       */
      userOptional(options?: IArgumentOptions): Promise<discord.User | null>;

      /**
       * Parses a mention string or user id and resolves a [[discord.GuildMember]] object reference.
       * If the member was not found, the command will error.
       * The command will error if it was not used in a guild.
       * @param options argument config
       */
      guildMember(options?: IArgumentOptions): Promise<discord.GuildMember>;
      /**
       * Optionally parses a mention string or user id and resolves a [[discord.GuildMember]] object reference.
       * If the argument is present but the member was not found, the command will error.
       * Like all optional arguments, if the argument is not present the value will be resolved as null.
       * @param options argument config
       */
      guildMemberOptional(options?: IArgumentOptions): Promise<discord.GuildMember | null>;
    }

    /**
     * Options specified when registering commands.
     */
    interface ICommandOptions {
      /**
       * The name of the command. Users will use this name to execute the command.
       */
      name: string;
      /**
       * A human-readable description for this command.
       */
      description?: string;
      /**
       * A composition of filters that determine if the command can be executed.
       *
       * For a complete list of filters and their descriptions, see [[discord.command.filters]].
       */
      filters?: Array<filters.ICommandFilter> | filters.ICommandFilter;
      /**
       * Fired when an error occurs during the execution or validation of this command.
       */
      onError?: (ctx: ICommandContextDeprecated, e: Error) => void | Promise<void>;
    }

    interface ICommandContext {
      /**
       * The command being run.
       */
      command: Command;

      /**
       * The raw arguments, before they were parsed.
       */
      rawArguments: string;
    }

    interface ICommandContextDeprecated {
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

    /**
     * A type alias containing a union of possible command argument types.
     */
    type CommandArgumentTypes =
      | string
      | string[]
      | number
      | Promise<discord.User>
      | Promise<discord.User | null>
      | Promise<discord.GuildMember>
      | Promise<discord.GuildMember | null>
      | null;

    /**
     * A type alias describing the way to define arguments for a command. To be returned by [[discord.command.ArgumentsParser]].
     */
    type CommandArgumentsContainer = { [key: string]: CommandArgumentTypes } | null;

    /**
     * A type alias for a function called by the command handler to construct the argument requirements for a command.
     *
     * @param T A user-defined type (object) matching argument names (property names) to value types.
     * @param args A class containing possible command arguments, use return value from functions in this class as values for properties of T.
     */
    type ArgumentsParser<T extends CommandArgumentsContainer> = (args: ICommandArgs) => T;
    type CommandHandlerDeprecated<T> = (
      ctx: ICommandContextDeprecated,
      args: T
    ) => Promise<unknown>;

    /**
     * A function called when a command is executed.
     *
     * @param message A reference to the [[discord.GuildMemberMessage]] that triggered this command.
     * @param args An object containing entries for the command arguments parsed for this command.
     * @param ctx An object containing additional command context information.
     */
    type CommandHandler<T> = (
      message: discord.GuildMemberMessage,
      args: T,
      ctx: ICommandContext
    ) => Promise<unknown>;

    /**
     * Options used when creating a new [[discord.command.CommandGroup]].
     */
    interface ICommandGroupOptions {
      /**
       * A human-readable label for this command group.
       */
      label?: string;
      /**
       * A human-readable description for this command group.
       */
      description?: string;
      /**
       * The default prefix used to execute commands within this command group.
       *
       * If not specified, the default prefix is `!`.
       */
      defaultPrefix?: string;
      /**
       * An array of additional prefixes that may be used to trigger commands within this group.
       */
      additionalPrefixes?: string[];
      /**
       * If `true`, users will be able to run this command via a mention/ping, followed by a space, and the command name/arguments.
       */
      mentionPrefix?: boolean;
      /**
       * If `false`, the command group will not auto-register MESSAGE_CREATE events upon creation.
       */
      register?: false;
      /**
       * A composition of filters that determine if the command can be executed.
       *
       * For a complete list of filters and their descriptions, see [[discord.command.filters]].
       */
      filters?: Array<filters.ICommandFilter> | filters.ICommandFilter;
    }

    /**
     * An object containing parsed arguments for a command.
     */
    type ResolvedArgs<T extends CommandArgumentsContainer> = {
      [P in keyof T]: T[P] extends Promise<infer R> ? R : T[P];
    };

    interface ICommandExecutor {
      execute(
        message: discord.GuildMemberMessage,
        commandPrefix: string,
        rawArguments: string,
        isRootExecutor: boolean
      ): Promise<void>;
    }

    type Named<T> = { name: string } & T;

    /**
     * Command groups contain categories of logically separated groups of commands.
     *
     * Command Groups may specify filters that apply to all commands added to the group.
     *
     * Commands must be added to command groups via one of the registration methods available.
     */
    class CommandGroup implements ICommandExecutor {
      /**
       * Constructs a new command group. By default, this constructor will register message events and listen for messages that match commands added to the command group.
       *
       * @param options The options for this command group.
       */
      constructor(options?: ICommandGroupOptions);

      /**
       * Attaches the command executors provided.
       *
       * For more examples, see [[discord.command.handler]].
       *
       * Generally it is preferred to use [[discord.command.CommandGroup.on on]], [[discord.command.CommandGroup.raw raw]] and [[discord.command.CommandGroup.subcommand subcommand]] depending on how you wish
       * to structure your module. Attach is generally more useful when you are importing un-attached commands from various modules, whereas [[discord.command.CommandGroup.on on]] & company are useful if you
       * want to define your command handlers in-line.
       *
       * @param executors An object, keyed by the name that the command executor will use.
       */
      attach(executors: { [name: string]: discord.command.ICommandExecutor }): this;

      /**
       * Sets the filter(s) to be used for this command group. All child commands will use these filters.
       *
       * Note: Replaces any filters set previously.
       *
       * @param filter The filter composition to use for this command group.
       */
      setFilter(filter?: filters.ICommandFilter | null): this;

      /**
       * Registers a command that expects arguments.
       *
       * If argument parsing/validation fails, an error will be returned to the user and the handler will not run.
       *
       * #### Example
       *
       * Creates a script that will have a command that returns a number that has been multiplied by 2, as `!double N`, where `!double 4` would output `8`
       *
       * ```ts
       * const commandGroup = new discord.command.CommandGroup();
       * commandGroup.on(
       *   'double',
       *   (ctx) => ({ n: ctx.integer() }),
       *   (message, { n }) => message.reply(`${n * 2}`)
       * );
       * ```
       *
       * @param options A string containing the name of the command, or an object with more options (including filters, description, etc).
       * @param parser A function that collects the argument types this command expects.
       * @param handler A function to be ran when command validation succeeds and the command should be executed.
       */
      on<T extends CommandArgumentsContainer>(
        options: string | ICommandOptions,
        parser: ArgumentsParser<T>,
        handler: CommandHandler<ResolvedArgs<T>>
      ): this;

      /**
       * Registers a command that accepts any or no arguments.
       *
       * All text proceeding the command name is passed to the handler in the "args" parameter as a string.
       *
       * #### Example
       *
       * Creates a script that will reply with `pong!` when `!ping` is said in chat.
       *
       * ```ts
       * const commandGroup = new discord.command.CommandGroup();
       * commandGroup.raw("ping", message => message.reply("pong!"));
       * ```
       *
       * @param options A string containing the name of the command, or an object with more options (including filters, description, etc).
       * @param handler A function to be ran when command validation succeeds and the command should be executed.
       */
      raw(options: string | ICommandOptions, handler: CommandHandler<string>): this;

      /**
       *
       * Creates, registers and returns a sub-command group.
       *
       * This command is an alternate form of [[discord.command.CommandGroup.subcommand subcommand]], that lets capture the sub-command's [[discord.command.CommandGroup CommandGroup]]. For more on sub-commands, see the [[discord.command.CommandGroup.subcommand subcommand]] docs.
       *
       * #### Example:
       *
       * Creates a script that will have the following commands:
       *  - `!lights on`
       *  - `!lights off`
       *
       * ```ts
       * const commandGroup = new discord.command.CommandGroup();
       * const subCommandGroup = commandGroup.subcommandGroup("lights");
       * subCommandGroup.raw("on", m => m.reply("lights on turned on!"));
       * subCommandGroup.raw("off", m => m.reply("lights turned off!"));
       * ```
       *
       * @param options An object containing the command group's options. Register is not able to be set, as the command group is implicitly registered as a sub-command for this command group.
       */
      subcommandGroup(options: Named<Omit<ICommandGroupOptions, "register">>): CommandGroup;

      /**
       * Registers a command that may be followed by additional nested command groups.
       *
       * This is useful to further organize and group commands within a single parent command group.
       *
       * Sub-command groups are just like Command Groups, and will require filters of all parent sub-commands to be passed before executing any sub-commands.
       *
       * #### Example:
       *
       * Creates a script that will have the following commands:
       *  - `!lights on`
       *  - `!lights off`
       *
       * ```ts
       * const commandGroup = new discord.command.CommandGroup();
       * commandGroup.subcommand("lights", subCommandGroup => {
       *  subCommandGroup.raw("on", m => m.reply("lights on turned on!"));
       *  subCommandGroup.raw("off", m => m.reply("lights turned off!"));
       * });
       * ```
       *
       * @param options A string containing the name of the command, or an object with more options. See [[discord.command.ICommandGroupOptions]]. The `name` property must be present, specifying the name of the subcommand-group. Sub-command groups may not be automatically registered, so the `register` property must not be set.
       * @param commandGroup A CommandGroup instance (must not be previously registered) or a function which passes a nested CommandGroup as the first parameter.
       */
      subcommand(
        options: string | Named<Omit<ICommandGroupOptions, "register">>,
        commandGroup: (subCommandGroup: CommandGroup) => void
      ): this;

      /**
       * Deprecated - attach the subcommand group using [[discord.command.CommandGroup.attach attach]] instead.
       *
       * @deprecated
       */
      subcommand(
        options: string | Named<Omit<ICommandGroupOptions, "filters" | "register">>,
        commandGroup: CommandGroup
      ): this;

      /**
       * Registers a command that will run for any un-matched commands that match the command group's prefix(es) and the arguments specified.
       *
       * @param parser A function that collects the argument types this command expects.
       * @param handler A function to be ran when command validation succeeds and the command should be executed.
       * @param options Options for this default handler.
       */
      default<T extends CommandArgumentsContainer>(
        parser: ArgumentsParser<T>,
        handler: CommandHandler<ResolvedArgs<T>>,
        options?: Omit<ICommandOptions, "name">
      ): this;

      /**
       * Registers a command that will run for any un-matched commands that match the command group's prefix(es).
       *
       * All text proceeding the command name is passed to the handler in the "args" parameter as a string.
       *
       * @param handler A function to be ran when command validation succeeds and the command should be executed.
       * @param options Options for this default handler.
       */
      defaultRaw(handler: CommandHandler<string>, options?: Omit<ICommandOptions, "name">): this;

      /**
       * Registers a command that expects arguments.
       *
       * @deprecated Replaced by [[discord.command.CommandGroup.on on]].
       */
      registerCommand<T extends CommandArgumentsContainer>(
        options: string | ICommandOptions,
        parser: ArgumentsParser<T>,
        handler: CommandHandlerDeprecated<ResolvedArgs<T>>
      ): this;

      /**
       * Registers a command that expects no arguments.
       *
       * @deprecated Replaced by [[discord.command.CommandGroup.raw raw]].
       */
      registerCommand(
        options: string | ICommandOptions,
        handler: CommandHandlerDeprecated<null>
      ): this;

      /**
       * Executes the command group as an ICommandExecutor. This is an internal API, and is subject to breakage.
       *
       * @private - internal API, do not use.
       */
      execute(
        message: discord.GuildMemberMessage,
        commandPrefix: string,
        rawArguments: string,
        isRootExecutor: boolean
      ): Promise<void>;
    }

    /**
     * Creates an un-attached command handler that can be attached to a [[discord.command.CommandGroup CommandGroup]] using the [[discord.command.CommandGroup.attach attach]] method.
     *
     * If you have no need to split your handlers across modules, it's generally more preferred to use [[discord.command.CommandGroup.on CommandGroup.on]]!
     *
     * #### Example:
     * ```ts
     * const commandGroup = new discord.command.CommandGroup();
     * const hello = discord.command.handler(
     *  ctx => ({name: ctx.text()}),
     *  (msg, {name}) => msg.reply(`Hello ${name}`)
     * );
     *
     * commandGroup.attach({hello});
     * ```
     *
     * This allows you to export commands directly from modules.
     *
     * In `main.ts`:
     *
     * ```ts
     * import * as EconomyCommands from './economy-commands';
     * const commandGroup = new discord.command.CommandGroup();
     * commandGroup.attach(EconomyCommands);
     * ```
     *
     * In `economy-commands.ts`:
     * ```ts
     * export const balance = discord.command.rawHandler((m) =>
     *   m.reply('your balance is $50')
     * );
     * export const buy = discord.command.handler(
     *   (ctx) => ({ item: ctx.string() }),
     *   (m, { item }) => m.reply(`You bought **${item}**, your balance is now $0`)
     * );
     * ```
     *
     * @param parser A function that collects the argument types this command expects.
     * @param handler A function to be ran when command validation succeeds and the command should be executed.
     * @param options A object containing the command options (filters, description, etc). It is not possible to specify a name here.
     */
    function handler<T extends CommandArgumentsContainer>(
      parser: ArgumentsParser<T>,
      handler: CommandHandler<ResolvedArgs<T>>,
      options?: Omit<ICommandOptions, "name">
    ): ICommandExecutor;

    /**
     * Creates an un-attached command handler which processes no arguments that can be attached to a [[discord.command.CommandGroup]] using the [[discord.command.CommandGroup.attach]] method.
     *
     * If you have no need to split your handlers across modules, it's generally more preferred to use [[discord.command.CommandGroup.raw]]!
     *
     * #### Examples
     *
     * ```ts
     * const commandGroup = new discord.command.CommandGroup();
     * const ping = discord.command.rawHandler(m => m.reply(`pong!`));
     * commandGroup.attach({pong});
     * ```
     *
     * For more examples, see the [[discord.command.handler]].
     *
     * @param handler A function to be ran when command validation succeeds and the command should be executed.
     * @param options A object containing the command options (filters, description, etc). It is not possible to specify a name here.
     */
    function rawHandler(
      handler: CommandHandler<string>,
      options?: Omit<ICommandOptions, "name">
    ): ICommandExecutor;
  }

  const enum Permissions {
    CREATE_INSTANT_INVITE = 1,
    KICK_MEMBERS = 1 << 1,
    BAN_MEMBERS = 1 << 2,
    ADMINISTRATOR = 1 << 3,
    MANAGE_CHANNELS = 1 << 4,
    MANAGE_GUILD = 1 << 5,
    ADD_REACTIONS = 1 << 6,
    VIEW_AUDIT_LOGS = 1 << 7,
    VOICE_PRIORITY_SPEAKER = 1 << 8,
    STREAM = 1 << 9,
    READ_MESSAGES = 1 << 10,
    SEND_MESSAGES = 1 << 11,
    SEND_TTS_MESSAGES = 1 << 12,
    MANAGE_MESSAGES = 1 << 13,
    EMBED_LINKS = 1 << 14,
    ATTACH_FILES = 1 << 15,
    READ_MESSAGE_HISTORY = 1 << 16,
    MENTION_EVERYONE = 1 << 17,
    EXTERNAL_EMOJIS = 1 << 18,
    VIEW_GUILD_ANALYTICS = 1 << 19,
    VOICE_CONNECT = 1 << 20,
    VOICE_SPEAK = 1 << 21,
    VOICE_MUTE_MEMBERS = 1 << 22,
    VOICE_DEAFEN_MEMBERS = 1 << 23,
    VOICE_MOVE_MEMBERS = 1 << 24,
    VOICE_USE_VAD = 1 << 25,
    CHANGE_NICKNAME = 1 << 26,
    MANAGE_NICKNAMES = 1 << 27,
    MANAGE_ROLES = 1 << 28,
    MANAGE_WEBHOOKS = 1 << 29,
    MANAGE_EMOJIS = 1 << 30,

    NONE = 0,
    ALL = CREATE_INSTANT_INVITE |
      KICK_MEMBERS |
      BAN_MEMBERS |
      ADMINISTRATOR |
      MANAGE_CHANNELS |
      MANAGE_GUILD |
      ADD_REACTIONS |
      VIEW_AUDIT_LOGS |
      VOICE_PRIORITY_SPEAKER |
      STREAM |
      READ_MESSAGES |
      SEND_MESSAGES |
      SEND_TTS_MESSAGES |
      MANAGE_MESSAGES |
      EMBED_LINKS |
      ATTACH_FILES |
      READ_MESSAGE_HISTORY |
      MENTION_EVERYONE |
      EXTERNAL_EMOJIS |
      VIEW_GUILD_ANALYTICS |
      VOICE_CONNECT |
      VOICE_SPEAK |
      VOICE_MUTE_MEMBERS |
      VOICE_DEAFEN_MEMBERS |
      VOICE_MOVE_MEMBERS |
      VOICE_USE_VAD |
      CHANGE_NICKNAME |
      MANAGE_NICKNAMES |
      MANAGE_ROLES |
      MANAGE_WEBHOOKS |
      MANAGE_EMOJIS,
  }
}
