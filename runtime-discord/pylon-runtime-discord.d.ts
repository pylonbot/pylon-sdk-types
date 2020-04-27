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
     * The default value of `0` means the feature is disabled for this channel.
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

    /**
     * Bulk-deletes messages from the channel. The bot must have `MANAGE_MESSAGES` permission in the channel to perform this action.
     *
     * You must supply no less than 2 and no greater than 100 messages to be deleted.
     *
     * If any supplied message is older than 2 weeks, the request will fail.
     *
     * Note: This action, when completed, will fire a [[discord.Event.MESSAGE_DELETE_BULK]] event.
     *
     * If an error occurs, a [[discord.ApiError]] exception will be thrown.
     *
     * @param messages An iterable (Array, Set, etc) of message ids to delete.
     *
     */
    bulkDeleteMessages(messages: Iterable<Snowflake>): Promise<void>;
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

    /**
     * Bulk-deletes messages from the channel. The bot must have `MANAGE_MESSAGES` permission in the channel to perform this action.
     *
     * You must supply no less than 2 and no greater than 100 messages to be deleted.
     *
     * If any supplied message is older than 2 weeks, the request will fail.
     *
     * Note: This action, when completed, will fire a [[discord.Event.MESSAGE_DELETE_BULK]] event.
     *
     * If an error occurs, a [[discord.ApiError]] exception will be thrown.
     *
     * @param messages An iterable (array, set, etc) of message ids to delete.
     *
     */
    bulkDeleteMessages(messages: Iterable<Snowflake>): Promise<void>;
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
     * Deletes all the reactions on this message.
     *
     * Note: Will fire a [[Event.MESSAGE_REACTION_REMOVE_ALL]] event, if registered.
     *
     * If an error occurred, a [[discord.ApiError]] exception is thrown.
     */
    deleteAllReactions(): Promise<void>;

    /**
     * Deletes all reactions for the emoji specified on this message.
     *
     * If an error occurred, a [[discord.ApiError]] exception is thrown.
     *
     * @param emoji A raw unicode emoji like ✅, or a custom emoji in the format of `name:id`
     */
    deleteAllReactionsForEmoji(emoji: string): Promise<void>;

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
       * @deprecated Replaced by [[discord.command.CommandGroup.on]].
       */
      registerCommand<T extends CommandArgumentsContainer>(
        options: string | ICommandOptions,
        parser: ArgumentsParser<T>,
        handler: CommandHandlerDeprecated<ResolvedArgs<T>>
      ): this;

      /**
       * Registers a command that expects no arguments.
       *
       * @deprecated Replaced by [[discord.command.CommandGroup.raw]].
       */
      registerCommand(
        options: string | ICommandOptions,
        handler: CommandHandlerDeprecated<null>
      ): this;

      /**
       * Manually executes the command group given a [[discord.Message]]. Useful if you specify `{ register: false }` when instantiating a new CommandGroup.
       *
       * If the message is not to be handled by this command group (given the command prefix and command name) the Promise will resolve as `false`.
       *
       * If the message was otherwise handled and executed, it will otherwise resolve `true`.
       *
       * Note: Use [[discord.command.CommandGroup.checkMessage]] to check (without executing) if the CommandGroup will execute for the given message.
       *
       * @returns `true` if a command was handled and executed successfully. The function will throw if the command handler errors.
       *
       */
      handleMessage(message: discord.Message): Promise<boolean>;

      /**
       * Determines if the command group will execute given the supplied message, without executing the command.
       *
       * Note: Use [[discord.command.CommandGroup.handleMessage]] to execute a command within the CommandGroup.
       *
       * @param message
       */
      checkMessage(message: discord.Message): Promise<boolean>;

      /**
       * Executes the command group as an ICommandExecutor. This is an Internal API, and is subject to breakage.
       *
       * @private - Internal API, do not use. Use [[discord.command.CommandGroup.handleMessage]] to execute command groups manually.
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

  /**
   * An enumeration of permission bits that indicate an action users may or may not perform.
   *
   * For more information on Discord permissions, please see their docs on permissions.
   *
   * https://discordapp.com/developers/docs/topics/permissions
   */
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

    /**
     * A utility combining all permissions.
     */
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

  /**
   * The `decor` (decorations) module aims to provide constants for decorative items such as emojis and colors.
   */
  module decor {
    /**
     * An enumeration of numerical representations of default role color-picker options, as shown in the Discord client app.
     */
    const enum RoleColors {
      /**
       * Hex `#99AAB5` RGB: `rgb(153, 170, 181)`
       */
      DEFAULT = 0x99aab5,

      /**
       * Hex: `#1ABC9C` RGB: `rgb(26, 188, 156)`
       */
      CYAN = 0x1abc9c,

      /**
       * Hex: `#11806A` RGB: `rgb(17, 128, 106)`
       */
      DARK_CYAN = 0x11806a,

      /**
       * Hex: `#2ECC71` RGB: `rgb(46, 204, 113)`
       */
      GREEN = 0x2ecc71,

      /**
       * Hex: `#1F8B4C` RGB: `rgb(31, 139, 76)`
       */
      DARK_GREEN = 0x1f8b4c,

      /**
       * Hex: `#3498DB` RGB: `rgb(52, 152, 219)`
       */
      BLUE = 0x3498db,

      /**
       * Hex: `#206694` RGB: `rgb(32, 102, 148)`
       */
      DARK_BLUE = 0x206694,

      /**
       * Hex: `#9B59B6` RGB: `rgb(155, 89, 182)`
       */
      PURPLE = 0x9b59b6,

      /**
       * Hex: `#71368A` RGB: `rgb(113, 54, 138)`
       */
      DARK_PURPLE = 0x71368a,

      /**
       * Hex: `#E91E63` RGB: `rgb(233, 30, 99)`
       */
      PINK = 0xe91e63,

      /**
       * Hex: `#AD1457` RGB: `rgb(173, 20, 87)`
       */
      DARK_PINK = 0xad1457,

      /**
       * Hex: `#F1C40F` RGB: `rgb(241, 196, 15)`
       */
      YELLOW = 0xf1c40f,

      /**
       * Hex: `#C27C0E` RGB: `rgb(194, 124, 14)`
       */
      DARK_YELLOW = 0xc27c0e,

      /**
       * Hex: `#E67E22` RGB: `rgb(230, 126, 34)`
       */
      ORANGE = 0xe67e22,

      /**
       * Hex: `#A84300` RGB: `rgb(168, 67, 0)`
       */
      DARK_ORANGE = 0xa84300,

      /**
       * Hex: `#E74C3C` RGB: `rgb(231, 76, 60)`
       */
      RED = 0xe74c3c,

      /**
       * Hex: `#992D22` RGB: `rgb(153, 45, 34)`
       */
      DARK_RED = 0x992d22,

      /**
       * Hex: `#95A5A6` RGB: `rgb(149, 165, 166)`
       */
      GRAY = 0x95a5a6,

      /**
       * Hex: `#979C9F` RGB: `rgb(151, 156, 159)`
       */
      DARK_GRAY = 0x979c9f,

      /**
       * Hex: `#607D8B` RGB: `rgb(96, 125, 139)`
       */
      SLATE = 0x607d8b,

      /**
       * Hex: `#546E7A` RGB: `rgb(84, 110, 122)`
       */
      DARK_SLATE = 0x546e7a,
    }

    /**
     * An enumeration mapping Discord emoji names to their unicode literal.
     *
     * For simplicity, the keys represent the same names you may use when sending messages with the Discord client.
     * Some emojis may be represented more than once, in which case their aliases are listed in the documentation header.
     */
    const enum Emojis {
      /**
       * Emoji: 😀
       */
      "GRINNING" = "😀",
      /**
       * Emoji: 😬
       */
      "GRIMACING" = "😬",
      /**
       * Emoji: 😁
       */
      "GRIN" = "😁",
      /**
       * Emoji: 😂
       */
      "JOY" = "😂",
      /**
       * Emoji: 😃
       */
      "SMILEY" = "😃",
      /**
       * Emoji: 😄
       */
      "SMILE" = "😄",
      /**
       * Emoji: 😅
       */
      "SWEAT_SMILE" = "😅",
      /**
       * Emoji: 😆
       *
       * Aliases: `SATISFIED`
       */
      "LAUGHING" = "😆",
      /**
       * Emoji: 😆
       *
       * Aliases: `LAUGHING`
       */
      "SATISFIED" = "😆",
      /**
       * Emoji: 😇
       */
      "INNOCENT" = "😇",
      /**
       * Emoji: 😉
       */
      "WINK" = "😉",
      /**
       * Emoji: 😊
       */
      "BLUSH" = "😊",
      /**
       * Emoji: 🙂
       *
       * Aliases: `SLIGHTLY_SMILING_FACE`
       */
      "SLIGHT_SMILE" = "🙂",
      /**
       * Emoji: 🙂
       *
       * Aliases: `SLIGHT_SMILE`
       */
      "SLIGHTLY_SMILING_FACE" = "🙂",
      /**
       * Emoji: 🙃
       *
       * Aliases: `UPSIDE_DOWN_FACE`
       */
      "UPSIDE_DOWN" = "🙃",
      /**
       * Emoji: 🙃
       *
       * Aliases: `UPSIDE_DOWN`
       */
      "UPSIDE_DOWN_FACE" = "🙃",
      /**
       * Emoji: ☺
       */
      "RELAXED" = "☺",
      /**
       * Emoji: 😋
       */
      "YUM" = "😋",
      /**
       * Emoji: 😌
       */
      "RELIEVED" = "😌",
      /**
       * Emoji: 😍
       */
      "HEART_EYES" = "😍",
      /**
       * Emoji: 😘
       */
      "KISSING_HEART" = "😘",
      /**
       * Emoji: 😗
       */
      "KISSING" = "😗",
      /**
       * Emoji: 😙
       */
      "KISSING_SMILING_EYES" = "😙",
      /**
       * Emoji: 😚
       */
      "KISSING_CLOSED_EYES" = "😚",
      /**
       * Emoji: 😜
       */
      "STUCK_OUT_TONGUE_WINKING_EYE" = "😜",
      /**
       * Emoji: 😝
       */
      "STUCK_OUT_TONGUE_CLOSED_EYES" = "😝",
      /**
       * Emoji: 😛
       */
      "STUCK_OUT_TONGUE" = "😛",
      /**
       * Emoji: 🤑
       *
       * Aliases: `MONEY_MOUTH_FACE`
       */
      "MONEY_MOUTH" = "🤑",
      /**
       * Emoji: 🤑
       *
       * Aliases: `MONEY_MOUTH`
       */
      "MONEY_MOUTH_FACE" = "🤑",
      /**
       * Emoji: 🤓
       *
       * Aliases: `NERD_FACE`
       */
      "NERD" = "🤓",
      /**
       * Emoji: 🤓
       *
       * Aliases: `NERD`
       */
      "NERD_FACE" = "🤓",
      /**
       * Emoji: 😎
       */
      "SUNGLASSES" = "😎",
      /**
       * Emoji: 🤗
       *
       * Aliases: `HUGGING_FACE`
       */
      "HUGGING" = "🤗",
      /**
       * Emoji: 🤗
       *
       * Aliases: `HUGGING`
       */
      "HUGGING_FACE" = "🤗",
      /**
       * Emoji: 😏
       */
      "SMIRK" = "😏",
      /**
       * Emoji: 😶
       */
      "NO_MOUTH" = "😶",
      /**
       * Emoji: 😐
       */
      "NEUTRAL_FACE" = "😐",
      /**
       * Emoji: 😑
       */
      "EXPRESSIONLESS" = "😑",
      /**
       * Emoji: 😒
       */
      "UNAMUSED" = "😒",
      /**
       * Emoji: 🙄
       *
       * Aliases: `FACE_WITH_ROLLING_EYES`
       */
      "ROLLING_EYES" = "🙄",
      /**
       * Emoji: 🙄
       *
       * Aliases: `ROLLING_EYES`
       */
      "FACE_WITH_ROLLING_EYES" = "🙄",
      /**
       * Emoji: 🤔
       *
       * Aliases: `THINKING_FACE`
       */
      "THINKING" = "🤔",
      /**
       * Emoji: 🤔
       *
       * Aliases: `THINKING`
       */
      "THINKING_FACE" = "🤔",
      /**
       * Emoji: 😳
       */
      "FLUSHED" = "😳",
      /**
       * Emoji: 😞
       */
      "DISAPPOINTED" = "😞",
      /**
       * Emoji: 😟
       */
      "WORRIED" = "😟",
      /**
       * Emoji: 😠
       */
      "ANGRY" = "😠",
      /**
       * Emoji: 😡
       */
      "RAGE" = "😡",
      /**
       * Emoji: 😔
       */
      "PENSIVE" = "😔",
      /**
       * Emoji: 😕
       */
      "CONFUSED" = "😕",
      /**
       * Emoji: 🙁
       *
       * Aliases: `SLIGHTLY_FROWNING_FACE`
       */
      "SLIGHT_FROWN" = "🙁",
      /**
       * Emoji: 🙁
       *
       * Aliases: `SLIGHT_FROWN`
       */
      "SLIGHTLY_FROWNING_FACE" = "🙁",
      /**
       * Emoji: ☹
       *
       * Aliases: `WHITE_FROWNING_FACE`
       */
      "FROWNING2" = "☹",
      /**
       * Emoji: ☹
       *
       * Aliases: `FROWNING2`
       */
      "WHITE_FROWNING_FACE" = "☹",
      /**
       * Emoji: 😣
       */
      "PERSEVERE" = "😣",
      /**
       * Emoji: 😖
       */
      "CONFOUNDED" = "😖",
      /**
       * Emoji: 😫
       */
      "TIRED_FACE" = "😫",
      /**
       * Emoji: 😩
       */
      "WEARY" = "😩",
      /**
       * Emoji: 😤
       */
      "TRIUMPH" = "😤",
      /**
       * Emoji: 😮
       */
      "OPEN_MOUTH" = "😮",
      /**
       * Emoji: 😱
       */
      "SCREAM" = "😱",
      /**
       * Emoji: 😨
       */
      "FEARFUL" = "😨",
      /**
       * Emoji: 😰
       */
      "COLD_SWEAT" = "😰",
      /**
       * Emoji: 😯
       */
      "HUSHED" = "😯",
      /**
       * Emoji: 😦
       */
      "FROWNING" = "😦",
      /**
       * Emoji: 😧
       */
      "ANGUISHED" = "😧",
      /**
       * Emoji: 😢
       */
      "CRY" = "😢",
      /**
       * Emoji: 😥
       */
      "DISAPPOINTED_RELIEVED" = "😥",
      /**
       * Emoji: 😪
       */
      "SLEEPY" = "😪",
      /**
       * Emoji: 😓
       */
      "SWEAT" = "😓",
      /**
       * Emoji: 😭
       */
      "SOB" = "😭",
      /**
       * Emoji: 😵
       */
      "DIZZY_FACE" = "😵",
      /**
       * Emoji: 😲
       */
      "ASTONISHED" = "😲",
      /**
       * Emoji: 🤐
       *
       * Aliases: `ZIPPER_MOUTH_FACE`
       */
      "ZIPPER_MOUTH" = "🤐",
      /**
       * Emoji: 🤐
       *
       * Aliases: `ZIPPER_MOUTH`
       */
      "ZIPPER_MOUTH_FACE" = "🤐",
      /**
       * Emoji: 😷
       */
      "MASK" = "😷",
      /**
       * Emoji: 🤒
       *
       * Aliases: `FACE_WITH_THERMOMETER`
       */
      "THERMOMETER_FACE" = "🤒",
      /**
       * Emoji: 🤒
       *
       * Aliases: `THERMOMETER_FACE`
       */
      "FACE_WITH_THERMOMETER" = "🤒",
      /**
       * Emoji: 🤕
       *
       * Aliases: `FACE_WITH_HEAD_BANDAGE`
       */
      "HEAD_BANDAGE" = "🤕",
      /**
       * Emoji: 🤕
       *
       * Aliases: `HEAD_BANDAGE`
       */
      "FACE_WITH_HEAD_BANDAGE" = "🤕",
      /**
       * Emoji: 😴
       */
      "SLEEPING" = "😴",
      /**
       * Emoji: 💤
       */
      "ZZZ" = "💤",
      /**
       * Emoji: 💩
       *
       * Aliases: `SHIT`,`HANKEY`,`POO`
       */
      "POOP" = "💩",
      /**
       * Emoji: 💩
       *
       * Aliases: `POOP`,`HANKEY`,`POO`
       */
      "SHIT" = "💩",
      /**
       * Emoji: 💩
       *
       * Aliases: `POOP`,`SHIT`,`POO`
       */
      "HANKEY" = "💩",
      /**
       * Emoji: 💩
       *
       * Aliases: `POOP`,`SHIT`,`HANKEY`
       */
      "POO" = "💩",
      /**
       * Emoji: 😈
       */
      "SMILING_IMP" = "😈",
      /**
       * Emoji: 👿
       */
      "IMP" = "👿",
      /**
       * Emoji: 👹
       */
      "JAPANESE_OGRE" = "👹",
      /**
       * Emoji: 👺
       */
      "JAPANESE_GOBLIN" = "👺",
      /**
       * Emoji: 💀
       *
       * Aliases: `SKELETON`
       */
      "SKULL" = "💀",
      /**
       * Emoji: 💀
       *
       * Aliases: `SKULL`
       */
      "SKELETON" = "💀",
      /**
       * Emoji: 👻
       */
      "GHOST" = "👻",
      /**
       * Emoji: 👽
       */
      "ALIEN" = "👽",
      /**
       * Emoji: 🤖
       *
       * Aliases: `ROBOT_FACE`
       */
      "ROBOT" = "🤖",
      /**
       * Emoji: 🤖
       *
       * Aliases: `ROBOT`
       */
      "ROBOT_FACE" = "🤖",
      /**
       * Emoji: 😺
       */
      "SMILEY_CAT" = "😺",
      /**
       * Emoji: 😸
       */
      "SMILE_CAT" = "😸",
      /**
       * Emoji: 😹
       */
      "JOY_CAT" = "😹",
      /**
       * Emoji: 😻
       */
      "HEART_EYES_CAT" = "😻",
      /**
       * Emoji: 😼
       */
      "SMIRK_CAT" = "😼",
      /**
       * Emoji: 😽
       */
      "KISSING_CAT" = "😽",
      /**
       * Emoji: 🙀
       */
      "SCREAM_CAT" = "🙀",
      /**
       * Emoji: 😿
       */
      "CRYING_CAT_FACE" = "😿",
      /**
       * Emoji: 😾
       */
      "POUTING_CAT" = "😾",
      /**
       * Emoji: 🙌
       */
      "RAISED_HANDS" = "🙌",
      /**
       * Emoji: 👏
       */
      "CLAP" = "👏",
      /**
       * Emoji: 👋
       */
      "WAVE" = "👋",
      /**
       * Emoji: 👍
       *
       * Aliases: `_+1`,`THUMBUP`
       */
      "THUMBSUP" = "👍",
      /**
       * Emoji: 👍
       *
       * Aliases: `THUMBSUP`,`THUMBUP`
       */
      "_+1" = "👍",
      /**
       * Emoji: 👍
       *
       * Aliases: `THUMBSUP`,`_+1`
       */
      "THUMBUP" = "👍",
      /**
       * Emoji: 👎
       *
       * Aliases: `_-1`,`THUMBDOWN`
       */
      "THUMBSDOWN" = "👎",
      /**
       * Emoji: 👎
       *
       * Aliases: `THUMBSDOWN`,`THUMBDOWN`
       */
      "_-1" = "👎",
      /**
       * Emoji: 👎
       *
       * Aliases: `THUMBSDOWN`,`_-1`
       */
      "THUMBDOWN" = "👎",
      /**
       * Emoji: 👊
       */
      "PUNCH" = "👊",
      /**
       * Emoji: ✊
       */
      "FIST" = "✊",
      /**
       * Emoji: ✌
       */
      "V" = "✌",
      /**
       * Emoji: 👌
       */
      "OK_HAND" = "👌",
      /**
       * Emoji: ✋
       */
      "RAISED_HAND" = "✋",
      /**
       * Emoji: 👐
       */
      "OPEN_HANDS" = "👐",
      /**
       * Emoji: 💪
       */
      "MUSCLE" = "💪",
      /**
       * Emoji: 🙏
       */
      "PRAY" = "🙏",
      /**
       * Emoji: ☝
       */
      "POINT_UP" = "☝",
      /**
       * Emoji: 👆
       */
      "POINT_UP_2" = "👆",
      /**
       * Emoji: 👇
       */
      "POINT_DOWN" = "👇",
      /**
       * Emoji: 👈
       */
      "POINT_LEFT" = "👈",
      /**
       * Emoji: 👉
       */
      "POINT_RIGHT" = "👉",
      /**
       * Emoji: 🖕
       *
       * Aliases: `REVERSED_HAND_WITH_MIDDLE_FINGER_EXTENDED`
       */
      "MIDDLE_FINGER" = "🖕",
      /**
       * Emoji: 🖕
       *
       * Aliases: `MIDDLE_FINGER`
       */
      "REVERSED_HAND_WITH_MIDDLE_FINGER_EXTENDED" = "🖕",
      /**
       * Emoji: 🖐
       *
       * Aliases: `RAISED_HAND_WITH_FINGERS_SPLAYED`
       */
      "HAND_SPLAYED" = "🖐",
      /**
       * Emoji: 🖐
       *
       * Aliases: `HAND_SPLAYED`
       */
      "RAISED_HAND_WITH_FINGERS_SPLAYED" = "🖐",
      /**
       * Emoji: 🤘
       *
       * Aliases: `SIGN_OF_THE_HORNS`
       */
      "METAL" = "🤘",
      /**
       * Emoji: 🤘
       *
       * Aliases: `METAL`
       */
      "SIGN_OF_THE_HORNS" = "🤘",
      /**
       * Emoji: 🖖
       *
       * Aliases: `RAISED_HAND_WITH_PART_BETWEEN_MIDDLE_AND_RING_FINGERS`
       */
      "VULCAN" = "🖖",
      /**
       * Emoji: 🖖
       *
       * Aliases: `VULCAN`
       */
      "RAISED_HAND_WITH_PART_BETWEEN_MIDDLE_AND_RING_FINGERS" = "🖖",
      /**
       * Emoji: ✍
       */
      "WRITING_HAND" = "✍",
      /**
       * Emoji: 💅
       */
      "NAIL_CARE" = "💅",
      /**
       * Emoji: 👄
       */
      "LIPS" = "👄",
      /**
       * Emoji: 👅
       */
      "TONGUE" = "👅",
      /**
       * Emoji: 👂
       */
      "EAR" = "👂",
      /**
       * Emoji: 👃
       */
      "NOSE" = "👃",
      /**
       * Emoji: 👁
       */
      "EYE" = "👁",
      /**
       * Emoji: 👀
       */
      "EYES" = "👀",
      /**
       * Emoji: 👤
       */
      "BUST_IN_SILHOUETTE" = "👤",
      /**
       * Emoji: 👥
       */
      "BUSTS_IN_SILHOUETTE" = "👥",
      /**
       * Emoji: 🗣
       *
       * Aliases: `SPEAKING_HEAD_IN_SILHOUETTE`
       */
      "SPEAKING_HEAD" = "🗣",
      /**
       * Emoji: 🗣
       *
       * Aliases: `SPEAKING_HEAD`
       */
      "SPEAKING_HEAD_IN_SILHOUETTE" = "🗣",
      /**
       * Emoji: 👶
       */
      "BABY" = "👶",
      /**
       * Emoji: 👦
       */
      "BOY" = "👦",
      /**
       * Emoji: 👧
       */
      "GIRL" = "👧",
      /**
       * Emoji: 👨
       */
      "MAN" = "👨",
      /**
       * Emoji: 👩
       */
      "WOMAN" = "👩",
      /**
       * Emoji: 👱
       *
       * Aliases: `PERSON_WITH_BLOND_HAIR`
       */
      "BLOND_HAIRED_PERSON" = "👱",
      /**
       * Emoji: 👱
       *
       * Aliases: `BLOND_HAIRED_PERSON`
       */
      "PERSON_WITH_BLOND_HAIR" = "👱",
      /**
       * Emoji: 👴
       */
      "OLDER_MAN" = "👴",
      /**
       * Emoji: 👵
       *
       * Aliases: `GRANDMA`
       */
      "OLDER_WOMAN" = "👵",
      /**
       * Emoji: 👵
       *
       * Aliases: `OLDER_WOMAN`
       */
      "GRANDMA" = "👵",
      /**
       * Emoji: 👲
       */
      "MAN_WITH_GUA_PI_MAO" = "👲",
      /**
       * Emoji: 👳
       *
       * Aliases: `PERSON_WITH_TURBAN`
       */
      "PERSON_WEARING_TURBAN" = "👳",
      /**
       * Emoji: 👳
       *
       * Aliases: `PERSON_WEARING_TURBAN`
       */
      "PERSON_WITH_TURBAN" = "👳",
      /**
       * Emoji: 👮
       *
       * Aliases: `COP`
       */
      "POLICE_OFFICER" = "👮",
      /**
       * Emoji: 👮
       *
       * Aliases: `POLICE_OFFICER`
       */
      "COP" = "👮",
      /**
       * Emoji: 👷
       */
      "CONSTRUCTION_WORKER" = "👷",
      /**
       * Emoji: 💂
       *
       * Aliases: `FOOT_GUARD`
       */
      "GUARD" = "💂",
      /**
       * Emoji: 💂
       *
       * Aliases: `GUARD`
       */
      "FOOT_GUARD" = "💂",
      /**
       * Emoji: 🕵
       *
       * Aliases: `SLEUTH_OR_SPY`,`DETECTIVE`
       */
      "SPY" = "🕵",
      /**
       * Emoji: 🕵
       *
       * Aliases: `SPY`,`DETECTIVE`
       */
      "SLEUTH_OR_SPY" = "🕵",
      /**
       * Emoji: 🕵
       *
       * Aliases: `SPY`,`SLEUTH_OR_SPY`
       */
      "DETECTIVE" = "🕵",
      /**
       * Emoji: 🎅
       */
      "SANTA" = "🎅",
      /**
       * Emoji: 👼
       */
      "ANGEL" = "👼",
      /**
       * Emoji: 👸
       */
      "PRINCESS" = "👸",
      /**
       * Emoji: 👰
       */
      "BRIDE_WITH_VEIL" = "👰",
      /**
       * Emoji: 🚶
       *
       * Aliases: `PEDESTRIAN`
       */
      "WALKING" = "🚶",
      /**
       * Emoji: 🚶
       *
       * Aliases: `WALKING`
       */
      "PEDESTRIAN" = "🚶",
      /**
       * Emoji: 🏃
       */
      "RUNNER" = "🏃",
      /**
       * Emoji: 💃
       *
       * Aliases: `WOMAN_DANCER`,`WOMAN_DANCING`
       */
      "DANCER" = "💃",
      /**
       * Emoji: 💃
       *
       * Aliases: `DANCER`,`WOMAN_DANCING`
       */
      "WOMAN_DANCER" = "💃",
      /**
       * Emoji: 💃
       *
       * Aliases: `DANCER`,`WOMAN_DANCER`
       */
      "WOMAN_DANCING" = "💃",
      /**
       * Emoji: 👯
       *
       * Aliases: `PEOPLE_WITH_BUNNY_EARS`
       */
      "DANCERS" = "👯",
      /**
       * Emoji: 👯
       *
       * Aliases: `DANCERS`
       */
      "PEOPLE_WITH_BUNNY_EARS" = "👯",
      /**
       * Emoji: 👫
       */
      "COUPLE" = "👫",
      /**
       * Emoji: 👬
       */
      "TWO_MEN_HOLDING_HANDS" = "👬",
      /**
       * Emoji: 👭
       */
      "TWO_WOMEN_HOLDING_HANDS" = "👭",
      /**
       * Emoji: 🙇
       */
      "BOW" = "🙇",
      /**
       * Emoji: 💁
       */
      "INFORMATION_DESK_PERSON" = "💁",
      /**
       * Emoji: 🙅
       *
       * Aliases: `NO_GOOD`,`PERSON_NO`
       */
      "PERSON_GESTURING_NO" = "🙅",
      /**
       * Emoji: 🙅
       *
       * Aliases: `PERSON_GESTURING_NO`,`PERSON_NO`
       */
      "NO_GOOD" = "🙅",
      /**
       * Emoji: 🙅
       *
       * Aliases: `PERSON_GESTURING_NO`,`NO_GOOD`
       */
      "PERSON_NO" = "🙅",
      /**
       * Emoji: 🙆
       *
       * Aliases: `OK_PERSON`,`GESTURE_OK`
       */
      "PERSON_GESTURING_OK" = "🙆",
      /**
       * Emoji: 🙆
       *
       * Aliases: `PERSON_GESTURING_OK`,`GESTURE_OK`
       */
      "OK_PERSON" = "🙆",
      /**
       * Emoji: 🙆
       *
       * Aliases: `PERSON_GESTURING_OK`,`OK_PERSON`
       */
      "GESTURE_OK" = "🙆",
      /**
       * Emoji: 🙋
       */
      "RAISING_HAND" = "🙋",
      /**
       * Emoji: 🙎
       */
      "PERSON_WITH_POUTING_FACE" = "🙎",
      /**
       * Emoji: 🙍
       */
      "PERSON_FROWNING" = "🙍",
      /**
       * Emoji: 💇
       */
      "HAIRCUT" = "💇",
      /**
       * Emoji: 💆
       */
      "MASSAGE" = "💆",
      /**
       * Emoji: 💑
       */
      "COUPLE_WITH_HEART" = "💑",
      /**
       * Emoji: 👩‍❤️‍👩
       *
       * Aliases: `COUPLE_WITH_HEART_WW`
       */
      "COUPLE_WW" = "👩‍❤️‍👩",
      /**
       * Emoji: 👩‍❤️‍👩
       *
       * Aliases: `COUPLE_WW`
       */
      "COUPLE_WITH_HEART_WW" = "👩‍❤️‍👩",
      /**
       * Emoji: 👨‍❤️‍👨
       *
       * Aliases: `COUPLE_WITH_HEART_MM`
       */
      "COUPLE_MM" = "👨‍❤️‍👨",
      /**
       * Emoji: 👨‍❤️‍👨
       *
       * Aliases: `COUPLE_MM`
       */
      "COUPLE_WITH_HEART_MM" = "👨‍❤️‍👨",
      /**
       * Emoji: 💏
       */
      "COUPLEKISS" = "💏",
      /**
       * Emoji: 👩‍❤️‍💋‍👩
       *
       * Aliases: `COUPLEKISS_WW`
       */
      "KISS_WW" = "👩‍❤️‍💋‍👩",
      /**
       * Emoji: 👩‍❤️‍💋‍👩
       *
       * Aliases: `KISS_WW`
       */
      "COUPLEKISS_WW" = "👩‍❤️‍💋‍👩",
      /**
       * Emoji: 👨‍❤️‍💋‍👨
       *
       * Aliases: `COUPLEKISS_MM`
       */
      "KISS_MM" = "👨‍❤️‍💋‍👨",
      /**
       * Emoji: 👨‍❤️‍💋‍👨
       *
       * Aliases: `KISS_MM`
       */
      "COUPLEKISS_MM" = "👨‍❤️‍💋‍👨",
      /**
       * Emoji: 👪
       */
      "FAMILY" = "👪",
      /**
       * Emoji: 👨‍👩‍👧
       */
      "FAMILY_MWG" = "👨‍👩‍👧",
      /**
       * Emoji: 👨‍👩‍👧‍👦
       */
      "FAMILY_MWGB" = "👨‍👩‍👧‍👦",
      /**
       * Emoji: 👨‍👩‍👦‍👦
       */
      "FAMILY_MWBB" = "👨‍👩‍👦‍👦",
      /**
       * Emoji: 👨‍👩‍👧‍👧
       */
      "FAMILY_MWGG" = "👨‍👩‍👧‍👧",
      /**
       * Emoji: 👩‍👩‍👦
       */
      "FAMILY_WWB" = "👩‍👩‍👦",
      /**
       * Emoji: 👩‍👩‍👧
       */
      "FAMILY_WWG" = "👩‍👩‍👧",
      /**
       * Emoji: 👩‍👩‍👧‍👦
       */
      "FAMILY_WWGB" = "👩‍👩‍👧‍👦",
      /**
       * Emoji: 👩‍👩‍👦‍👦
       */
      "FAMILY_WWBB" = "👩‍👩‍👦‍👦",
      /**
       * Emoji: 👩‍👩‍👧‍👧
       */
      "FAMILY_WWGG" = "👩‍👩‍👧‍👧",
      /**
       * Emoji: 👨‍👨‍👦
       */
      "FAMILY_MMB" = "👨‍👨‍👦",
      /**
       * Emoji: 👨‍👨‍👧
       */
      "FAMILY_MMG" = "👨‍👨‍👧",
      /**
       * Emoji: 👨‍👨‍👧‍👦
       */
      "FAMILY_MMGB" = "👨‍👨‍👧‍👦",
      /**
       * Emoji: 👨‍👨‍👦‍👦
       */
      "FAMILY_MMBB" = "👨‍👨‍👦‍👦",
      /**
       * Emoji: 👨‍👨‍👧‍👧
       */
      "FAMILY_MMGG" = "👨‍👨‍👧‍👧",
      /**
       * Emoji: 👨‍👦
       */
      "FAMILY_MB" = "👨‍👦",
      /**
       * Emoji: 👨‍👦‍👦
       */
      "FAMILY_MBB" = "👨‍👦‍👦",
      /**
       * Emoji: 👨‍👧
       */
      "FAMILY_MG" = "👨‍👧",
      /**
       * Emoji: 👨‍👧‍👦
       */
      "FAMILY_MGB" = "👨‍👧‍👦",
      /**
       * Emoji: 👨‍👧‍👧
       */
      "FAMILY_MGG" = "👨‍👧‍👧",
      /**
       * Emoji: 👩‍👦
       */
      "FAMILY_WB" = "👩‍👦",
      /**
       * Emoji: 👩‍👦‍👦
       */
      "FAMILY_WBB" = "👩‍👦‍👦",
      /**
       * Emoji: 👩‍👧
       */
      "FAMILY_WG" = "👩‍👧",
      /**
       * Emoji: 👩‍👧‍👦
       */
      "FAMILY_WGB" = "👩‍👧‍👦",
      /**
       * Emoji: 👩‍👧‍👧
       */
      "FAMILY_WGG" = "👩‍👧‍👧",
      /**
       * Emoji: 👚
       */
      "WOMANS_CLOTHES" = "👚",
      /**
       * Emoji: 👕
       */
      "SHIRT" = "👕",
      /**
       * Emoji: 👖
       */
      "JEANS" = "👖",
      /**
       * Emoji: 👔
       */
      "NECKTIE" = "👔",
      /**
       * Emoji: 👗
       */
      "DRESS" = "👗",
      /**
       * Emoji: 👙
       */
      "BIKINI" = "👙",
      /**
       * Emoji: 👘
       */
      "KIMONO" = "👘",
      /**
       * Emoji: 💄
       */
      "LIPSTICK" = "💄",
      /**
       * Emoji: 💋
       */
      "KISS" = "💋",
      /**
       * Emoji: 👣
       */
      "FOOTPRINTS" = "👣",
      /**
       * Emoji: 👠
       */
      "HIGH_HEEL" = "👠",
      /**
       * Emoji: 👡
       */
      "SANDAL" = "👡",
      /**
       * Emoji: 👢
       */
      "BOOT" = "👢",
      /**
       * Emoji: 👞
       */
      "MANS_SHOE" = "👞",
      /**
       * Emoji: 👟
       */
      "ATHLETIC_SHOE" = "👟",
      /**
       * Emoji: 👒
       */
      "WOMANS_HAT" = "👒",
      /**
       * Emoji: 🎩
       */
      "TOPHAT" = "🎩",
      /**
       * Emoji: ⛑
       *
       * Aliases: `HELMET_WITH_WHITE_CROSS`
       */
      "HELMET_WITH_CROSS" = "⛑",
      /**
       * Emoji: ⛑
       *
       * Aliases: `HELMET_WITH_CROSS`
       */
      "HELMET_WITH_WHITE_CROSS" = "⛑",
      /**
       * Emoji: 🎓
       */
      "MORTAR_BOARD" = "🎓",
      /**
       * Emoji: 👑
       */
      "CROWN" = "👑",
      /**
       * Emoji: 🎒
       */
      "SCHOOL_SATCHEL" = "🎒",
      /**
       * Emoji: 👝
       */
      "POUCH" = "👝",
      /**
       * Emoji: 👛
       */
      "PURSE" = "👛",
      /**
       * Emoji: 👜
       */
      "HANDBAG" = "👜",
      /**
       * Emoji: 💼
       */
      "BRIEFCASE" = "💼",
      /**
       * Emoji: 👓
       */
      "EYEGLASSES" = "👓",
      /**
       * Emoji: 🕶
       */
      "DARK_SUNGLASSES" = "🕶",
      /**
       * Emoji: 💍
       */
      "RING" = "💍",
      /**
       * Emoji: 🌂
       */
      "CLOSED_UMBRELLA" = "🌂",
      /**
       * Emoji: 🤠
       *
       * Aliases: `FACE_WITH_COWBOY_HAT`
       */
      "COWBOY" = "🤠",
      /**
       * Emoji: 🤠
       *
       * Aliases: `COWBOY`
       */
      "FACE_WITH_COWBOY_HAT" = "🤠",
      /**
       * Emoji: 🤡
       *
       * Aliases: `CLOWN_FACE`
       */
      "CLOWN" = "🤡",
      /**
       * Emoji: 🤡
       *
       * Aliases: `CLOWN`
       */
      "CLOWN_FACE" = "🤡",
      /**
       * Emoji: 🤢
       *
       * Aliases: `SICK`
       */
      "NAUSEATED_FACE" = "🤢",
      /**
       * Emoji: 🤢
       *
       * Aliases: `NAUSEATED_FACE`
       */
      "SICK" = "🤢",
      /**
       * Emoji: 🤣
       *
       * Aliases: `ROLLING_ON_THE_FLOOR_LAUGHING`
       */
      "ROFL" = "🤣",
      /**
       * Emoji: 🤣
       *
       * Aliases: `ROFL`
       */
      "ROLLING_ON_THE_FLOOR_LAUGHING" = "🤣",
      /**
       * Emoji: 🤤
       *
       * Aliases: `DROOL`
       */
      "DROOLING_FACE" = "🤤",
      /**
       * Emoji: 🤤
       *
       * Aliases: `DROOLING_FACE`
       */
      "DROOL" = "🤤",
      /**
       * Emoji: 🤥
       *
       * Aliases: `LIAR`
       */
      "LYING_FACE" = "🤥",
      /**
       * Emoji: 🤥
       *
       * Aliases: `LYING_FACE`
       */
      "LIAR" = "🤥",
      /**
       * Emoji: 🤧
       *
       * Aliases: `SNEEZE`
       */
      "SNEEZING_FACE" = "🤧",
      /**
       * Emoji: 🤧
       *
       * Aliases: `SNEEZING_FACE`
       */
      "SNEEZE" = "🤧",
      /**
       * Emoji: 🤴
       */
      "PRINCE" = "🤴",
      /**
       * Emoji: 🤵
       */
      "MAN_IN_TUXEDO" = "🤵",
      /**
       * Emoji: 🤶
       *
       * Aliases: `MOTHER_CHRISTMAS`
       */
      "MRS_CLAUS" = "🤶",
      /**
       * Emoji: 🤶
       *
       * Aliases: `MRS_CLAUS`
       */
      "MOTHER_CHRISTMAS" = "🤶",
      /**
       * Emoji: 🤦
       *
       * Aliases: `FACEPALM`
       */
      "FACE_PALM" = "🤦",
      /**
       * Emoji: 🤦
       *
       * Aliases: `FACE_PALM`
       */
      "FACEPALM" = "🤦",
      /**
       * Emoji: 🤷
       *
       * Aliases: `SHRUG`
       */
      "PERSON_SHRUGGING" = "🤷",
      /**
       * Emoji: 🤷
       *
       * Aliases: `PERSON_SHRUGGING`
       */
      "SHRUG" = "🤷",
      /**
       * Emoji: 🤰
       *
       * Aliases: `EXPECTING_WOMAN`
       */
      "PREGNANT_WOMAN" = "🤰",
      /**
       * Emoji: 🤰
       *
       * Aliases: `PREGNANT_WOMAN`
       */
      "EXPECTING_WOMAN" = "🤰",
      /**
       * Emoji: 🤳
       */
      "SELFIE" = "🤳",
      /**
       * Emoji: 🕺
       *
       * Aliases: `MALE_DANCER`
       */
      "MAN_DANCING" = "🕺",
      /**
       * Emoji: 🕺
       *
       * Aliases: `MAN_DANCING`
       */
      "MALE_DANCER" = "🕺",
      /**
       * Emoji: 🤙
       *
       * Aliases: `CALL_ME_HAND`
       */
      "CALL_ME" = "🤙",
      /**
       * Emoji: 🤙
       *
       * Aliases: `CALL_ME`
       */
      "CALL_ME_HAND" = "🤙",
      /**
       * Emoji: 🤚
       *
       * Aliases: `BACK_OF_HAND`
       */
      "RAISED_BACK_OF_HAND" = "🤚",
      /**
       * Emoji: 🤚
       *
       * Aliases: `RAISED_BACK_OF_HAND`
       */
      "BACK_OF_HAND" = "🤚",
      /**
       * Emoji: 🤛
       *
       * Aliases: `LEFT_FIST`
       */
      "LEFT_FACING_FIST" = "🤛",
      /**
       * Emoji: 🤛
       *
       * Aliases: `LEFT_FACING_FIST`
       */
      "LEFT_FIST" = "🤛",
      /**
       * Emoji: 🤜
       *
       * Aliases: `RIGHT_FIST`
       */
      "RIGHT_FACING_FIST" = "🤜",
      /**
       * Emoji: 🤜
       *
       * Aliases: `RIGHT_FACING_FIST`
       */
      "RIGHT_FIST" = "🤜",
      /**
       * Emoji: 🤝
       *
       * Aliases: `SHAKING_HANDS`
       */
      "HANDSHAKE" = "🤝",
      /**
       * Emoji: 🤝
       *
       * Aliases: `HANDSHAKE`
       */
      "SHAKING_HANDS" = "🤝",
      /**
       * Emoji: 🤞
       *
       * Aliases: `HAND_WITH_INDEX_AND_MIDDLE_FINGER_CROSSED`
       */
      "FINGERS_CROSSED" = "🤞",
      /**
       * Emoji: 🤞
       *
       * Aliases: `FINGERS_CROSSED`
       */
      "HAND_WITH_INDEX_AND_MIDDLE_FINGER_CROSSED" = "🤞",
      /**
       * Emoji: 🤩
       *
       * Aliases: `STARSTRUCK`,`STAR_EYES`
       */
      "STAR_STRUCK" = "🤩",
      /**
       * Emoji: 🤩
       *
       * Aliases: `STAR_STRUCK`,`STAR_EYES`
       */
      "STARSTRUCK" = "🤩",
      /**
       * Emoji: 🤩
       *
       * Aliases: `STAR_STRUCK`,`STARSTRUCK`
       */
      "STAR_EYES" = "🤩",
      /**
       * Emoji: 🤨
       *
       * Aliases: `RAISED_EYEBROW`,`COLBERT`,`SKEPTICAL`
       */
      "FACE_WITH_RAISED_EYEBROW" = "🤨",
      /**
       * Emoji: 🤨
       *
       * Aliases: `FACE_WITH_RAISED_EYEBROW`,`COLBERT`,`SKEPTICAL`
       */
      "RAISED_EYEBROW" = "🤨",
      /**
       * Emoji: 🤨
       *
       * Aliases: `FACE_WITH_RAISED_EYEBROW`,`RAISED_EYEBROW`,`SKEPTICAL`
       */
      "COLBERT" = "🤨",
      /**
       * Emoji: 🤨
       *
       * Aliases: `FACE_WITH_RAISED_EYEBROW`,`RAISED_EYEBROW`,`COLBERT`
       */
      "SKEPTICAL" = "🤨",
      /**
       * Emoji: 🤯
       *
       * Aliases: `MINDBLOWN`,`MIND_BLOWN`
       */
      "EXPLODING_HEAD" = "🤯",
      /**
       * Emoji: 🤯
       *
       * Aliases: `EXPLODING_HEAD`,`MIND_BLOWN`
       */
      "MINDBLOWN" = "🤯",
      /**
       * Emoji: 🤯
       *
       * Aliases: `EXPLODING_HEAD`,`MINDBLOWN`
       */
      "MIND_BLOWN" = "🤯",
      /**
       * Emoji: 🤪
       *
       * Aliases: `ZANY`,`CRAZY`
       */
      "ZANY_FACE" = "🤪",
      /**
       * Emoji: 🤪
       *
       * Aliases: `ZANY_FACE`,`CRAZY`
       */
      "ZANY" = "🤪",
      /**
       * Emoji: 🤪
       *
       * Aliases: `ZANY_FACE`,`ZANY`
       */
      "CRAZY" = "🤪",
      /**
       * Emoji: 🤬
       *
       * Aliases: `SWEARING`,`GRAWLIXES`,`CURSING`,`CUSSING`
       */
      "FACE_WITH_SYMBOLS_OVER_MOUTH" = "🤬",
      /**
       * Emoji: 🤬
       *
       * Aliases: `FACE_WITH_SYMBOLS_OVER_MOUTH`,`GRAWLIXES`,`CURSING`,`CUSSING`
       */
      "SWEARING" = "🤬",
      /**
       * Emoji: 🤬
       *
       * Aliases: `FACE_WITH_SYMBOLS_OVER_MOUTH`,`SWEARING`,`CURSING`,`CUSSING`
       */
      "GRAWLIXES" = "🤬",
      /**
       * Emoji: 🤬
       *
       * Aliases: `FACE_WITH_SYMBOLS_OVER_MOUTH`,`SWEARING`,`GRAWLIXES`,`CUSSING`
       */
      "CURSING" = "🤬",
      /**
       * Emoji: 🤬
       *
       * Aliases: `FACE_WITH_SYMBOLS_OVER_MOUTH`,`SWEARING`,`GRAWLIXES`,`CURSING`
       */
      "CUSSING" = "🤬",
      /**
       * Emoji: 🤮
       *
       * Aliases: `VOMITING`,`VOMIT`,`THROW_UP`
       */
      "FACE_VOMITING" = "🤮",
      /**
       * Emoji: 🤮
       *
       * Aliases: `FACE_VOMITING`,`VOMIT`,`THROW_UP`
       */
      "VOMITING" = "🤮",
      /**
       * Emoji: 🤮
       *
       * Aliases: `FACE_VOMITING`,`VOMITING`,`THROW_UP`
       */
      "VOMIT" = "🤮",
      /**
       * Emoji: 🤮
       *
       * Aliases: `FACE_VOMITING`,`VOMITING`,`VOMIT`
       */
      "THROW_UP" = "🤮",
      /**
       * Emoji: 🤫
       *
       * Aliases: `SHUSH`,`SHHH`
       */
      "SHUSHING_FACE" = "🤫",
      /**
       * Emoji: 🤫
       *
       * Aliases: `SHUSHING_FACE`,`SHHH`
       */
      "SHUSH" = "🤫",
      /**
       * Emoji: 🤫
       *
       * Aliases: `SHUSHING_FACE`,`SHUSH`
       */
      "SHHH" = "🤫",
      /**
       * Emoji: 🤭
       *
       * Aliases: `HAND_OVER_MOUTH`
       */
      "FACE_WITH_HAND_OVER_MOUTH" = "🤭",
      /**
       * Emoji: 🤭
       *
       * Aliases: `FACE_WITH_HAND_OVER_MOUTH`
       */
      "HAND_OVER_MOUTH" = "🤭",
      /**
       * Emoji: 🧐
       *
       * Aliases: `MONOCLE`
       */
      "FACE_WITH_MONOCLE" = "🧐",
      /**
       * Emoji: 🧐
       *
       * Aliases: `FACE_WITH_MONOCLE`
       */
      "MONOCLE" = "🧐",
      /**
       * Emoji: 🥰
       *
       * Aliases: `FACE_WITH_HEARTS`
       */
      "SMILING_FACE_WITH_3_HEARTS" = "🥰",
      /**
       * Emoji: 🥰
       *
       * Aliases: `SMILING_FACE_WITH_3_HEARTS`
       */
      "FACE_WITH_HEARTS" = "🥰",
      /**
       * Emoji: 🥵
       *
       * Aliases: `HOT`
       */
      "HOT_FACE" = "🥵",
      /**
       * Emoji: 🥵
       *
       * Aliases: `HOT_FACE`
       */
      "HOT" = "🥵",
      /**
       * Emoji: 🥶
       *
       * Aliases: `FREEZING_FACE`,`FREEZING`,`COLD`
       */
      "COLD_FACE" = "🥶",
      /**
       * Emoji: 🥶
       *
       * Aliases: `COLD_FACE`,`FREEZING`,`COLD`
       */
      "FREEZING_FACE" = "🥶",
      /**
       * Emoji: 🥶
       *
       * Aliases: `COLD_FACE`,`FREEZING_FACE`,`COLD`
       */
      "FREEZING" = "🥶",
      /**
       * Emoji: 🥶
       *
       * Aliases: `COLD_FACE`,`FREEZING_FACE`,`FREEZING`
       */
      "COLD" = "🥶",
      /**
       * Emoji: 🥳
       *
       * Aliases: `PARTYING`
       */
      "PARTYING_FACE" = "🥳",
      /**
       * Emoji: 🥳
       *
       * Aliases: `PARTYING_FACE`
       */
      "PARTYING" = "🥳",
      /**
       * Emoji: 🥴
       *
       * Aliases: `WOOZY`
       */
      "WOOZY_FACE" = "🥴",
      /**
       * Emoji: 🥴
       *
       * Aliases: `WOOZY_FACE`
       */
      "WOOZY" = "🥴",
      /**
       * Emoji: 🥺
       *
       * Aliases: `BEGGING_FACE`,`PLEADING`,`BEGGING`,`PUPPY_DOG_EYES`
       */
      "PLEADING_FACE" = "🥺",
      /**
       * Emoji: 🥺
       *
       * Aliases: `PLEADING_FACE`,`PLEADING`,`BEGGING`,`PUPPY_DOG_EYES`
       */
      "BEGGING_FACE" = "🥺",
      /**
       * Emoji: 🥺
       *
       * Aliases: `PLEADING_FACE`,`BEGGING_FACE`,`BEGGING`,`PUPPY_DOG_EYES`
       */
      "PLEADING" = "🥺",
      /**
       * Emoji: 🥺
       *
       * Aliases: `PLEADING_FACE`,`BEGGING_FACE`,`PLEADING`,`PUPPY_DOG_EYES`
       */
      "BEGGING" = "🥺",
      /**
       * Emoji: 🥺
       *
       * Aliases: `PLEADING_FACE`,`BEGGING_FACE`,`PLEADING`,`BEGGING`
       */
      "PUPPY_DOG_EYES" = "🥺",
      /**
       * Emoji: 🧒
       *
       * Aliases: `KID`
       */
      "CHILD" = "🧒",
      /**
       * Emoji: 🧒
       *
       * Aliases: `CHILD`
       */
      "KID" = "🧒",
      /**
       * Emoji: 🧑
       */
      "ADULT" = "🧑",
      /**
       * Emoji: 🧓
       *
       * Aliases: `OLD`
       */
      "OLDER_ADULT" = "🧓",
      /**
       * Emoji: 🧓
       *
       * Aliases: `OLDER_ADULT`
       */
      "OLD" = "🧓",
      /**
       * Emoji: 🧕
       *
       * Aliases: `HEADSCARF`
       */
      "WOMAN_WITH_HEADSCARF" = "🧕",
      /**
       * Emoji: 🧕
       *
       * Aliases: `WOMAN_WITH_HEADSCARF`
       */
      "HEADSCARF" = "🧕",
      /**
       * Emoji: 🧔
       *
       * Aliases: `BEARD`
       */
      "BEARDED_PERSON" = "🧔",
      /**
       * Emoji: 🧔
       *
       * Aliases: `BEARDED_PERSON`
       */
      "BEARD" = "🧔",
      /**
       * Emoji: 🤱
       */
      "BREAST_FEEDING" = "🤱",
      /**
       * Emoji: 🧙
       */
      "MAGE" = "🧙",
      /**
       * Emoji: 🧙‍♂️
       *
       * Aliases: `WIZARD`,`SORCERER`
       */
      "MAN_MAGE" = "🧙‍♂️",
      /**
       * Emoji: 🧙‍♂️
       *
       * Aliases: `MAN_MAGE`,`SORCERER`
       */
      "WIZARD" = "🧙‍♂️",
      /**
       * Emoji: 🧙‍♂️
       *
       * Aliases: `MAN_MAGE`,`WIZARD`
       */
      "SORCERER" = "🧙‍♂️",
      /**
       * Emoji: 🧙‍♀️
       *
       * Aliases: `WITCH`,`SORCERESS`
       */
      "WOMAN_MAGE" = "🧙‍♀️",
      /**
       * Emoji: 🧙‍♀️
       *
       * Aliases: `WOMAN_MAGE`,`SORCERESS`
       */
      "WITCH" = "🧙‍♀️",
      /**
       * Emoji: 🧙‍♀️
       *
       * Aliases: `WOMAN_MAGE`,`WITCH`
       */
      "SORCERESS" = "🧙‍♀️",
      /**
       * Emoji: 🧚
       */
      "FAIRY" = "🧚",
      /**
       * Emoji: 🧚‍♀️
       */
      "WOMAN_FAIRY" = "🧚‍♀️",
      /**
       * Emoji: 🧚‍♂️
       */
      "MAN_FAIRY" = "🧚‍♂️",
      /**
       * Emoji: 🧛
       */
      "VAMPIRE" = "🧛",
      /**
       * Emoji: 🧛‍♂️
       *
       * Aliases: `DRACULA`
       */
      "MAN_VAMPIRE" = "🧛‍♂️",
      /**
       * Emoji: 🧛‍♂️
       *
       * Aliases: `MAN_VAMPIRE`
       */
      "DRACULA" = "🧛‍♂️",
      /**
       * Emoji: 🧛‍♀️
       */
      "WOMAN_VAMPIRE" = "🧛‍♀️",
      /**
       * Emoji: 🧜
       */
      "MERPERSON" = "🧜",
      /**
       * Emoji: 🧜‍♀️
       *
       * Aliases: `MERGIRL`,`MERWOMAN`
       */
      "MERMAID" = "🧜‍♀️",
      /**
       * Emoji: 🧜‍♀️
       *
       * Aliases: `MERMAID`,`MERWOMAN`
       */
      "MERGIRL" = "🧜‍♀️",
      /**
       * Emoji: 🧜‍♀️
       *
       * Aliases: `MERMAID`,`MERGIRL`
       */
      "MERWOMAN" = "🧜‍♀️",
      /**
       * Emoji: 🧜‍♂️
       *
       * Aliases: `MERBOY`
       */
      "MERMAN" = "🧜‍♂️",
      /**
       * Emoji: 🧜‍♂️
       *
       * Aliases: `MERMAN`
       */
      "MERBOY" = "🧜‍♂️",
      /**
       * Emoji: 🧝
       */
      "ELF" = "🧝",
      /**
       * Emoji: 🧝‍♀️
       */
      "WOMAN_ELF" = "🧝‍♀️",
      /**
       * Emoji: 🧝‍♂️
       */
      "MAN_ELF" = "🧝‍♂️",
      /**
       * Emoji: 🧞
       *
       * Aliases: `DJINN`
       */
      "GENIE" = "🧞",
      /**
       * Emoji: 🧞
       *
       * Aliases: `GENIE`
       */
      "DJINN" = "🧞",
      /**
       * Emoji: 🧞‍♀️
       */
      "WOMAN_GENIE" = "🧞‍♀️",
      /**
       * Emoji: 🧞‍♂️
       */
      "MAN_GENIE" = "🧞‍♂️",
      /**
       * Emoji: 🧟
       *
       * Aliases: `UNDEAD`,`WALKING_DEAD`
       */
      "ZOMBIE" = "🧟",
      /**
       * Emoji: 🧟
       *
       * Aliases: `ZOMBIE`,`WALKING_DEAD`
       */
      "UNDEAD" = "🧟",
      /**
       * Emoji: 🧟
       *
       * Aliases: `ZOMBIE`,`UNDEAD`
       */
      "WALKING_DEAD" = "🧟",
      /**
       * Emoji: 🧟‍♀️
       */
      "WOMAN_ZOMBIE" = "🧟‍♀️",
      /**
       * Emoji: 🧟‍♂️
       */
      "MAN_ZOMBIE" = "🧟‍♂️",
      /**
       * Emoji: 🧖
       *
       * Aliases: `STEAMY_ROOM`,`SAUNA`
       */
      "PERSON_IN_STEAMY_ROOM" = "🧖",
      /**
       * Emoji: 🧖
       *
       * Aliases: `PERSON_IN_STEAMY_ROOM`,`SAUNA`
       */
      "STEAMY_ROOM" = "🧖",
      /**
       * Emoji: 🧖
       *
       * Aliases: `PERSON_IN_STEAMY_ROOM`,`STEAMY_ROOM`
       */
      "SAUNA" = "🧖",
      /**
       * Emoji: 🧖‍♂️
       *
       * Aliases: `MAN_IN_SAUNA`
       */
      "MAN_IN_STEAMY_ROOM" = "🧖‍♂️",
      /**
       * Emoji: 🧖‍♂️
       *
       * Aliases: `MAN_IN_STEAMY_ROOM`
       */
      "MAN_IN_SAUNA" = "🧖‍♂️",
      /**
       * Emoji: 🧖‍♀️
       *
       * Aliases: `WOMAN_IN_SAUNA`
       */
      "WOMAN_IN_STEAMY_ROOM" = "🧖‍♀️",
      /**
       * Emoji: 🧖‍♀️
       *
       * Aliases: `WOMAN_IN_STEAMY_ROOM`
       */
      "WOMAN_IN_SAUNA" = "🧖‍♀️",
      /**
       * Emoji: 🤟
       *
       * Aliases: `LOVE_YOU`,`ILY`
       */
      "LOVE_YOU_GESTURE" = "🤟",
      /**
       * Emoji: 🤟
       *
       * Aliases: `LOVE_YOU_GESTURE`,`ILY`
       */
      "LOVE_YOU" = "🤟",
      /**
       * Emoji: 🤟
       *
       * Aliases: `LOVE_YOU_GESTURE`,`LOVE_YOU`
       */
      "ILY" = "🤟",
      /**
       * Emoji: 🤲
       *
       * Aliases: `PALMS_TOGETHER`,`DUA`,`CUPPED_HANDS`
       */
      "PALMS_UP_TOGETHER" = "🤲",
      /**
       * Emoji: 🤲
       *
       * Aliases: `PALMS_UP_TOGETHER`,`DUA`,`CUPPED_HANDS`
       */
      "PALMS_TOGETHER" = "🤲",
      /**
       * Emoji: 🤲
       *
       * Aliases: `PALMS_UP_TOGETHER`,`PALMS_TOGETHER`,`CUPPED_HANDS`
       */
      "DUA" = "🤲",
      /**
       * Emoji: 🤲
       *
       * Aliases: `PALMS_UP_TOGETHER`,`PALMS_TOGETHER`,`DUA`
       */
      "CUPPED_HANDS" = "🤲",
      /**
       * Emoji: 🧠
       */
      "BRAIN" = "🧠",
      /**
       * Emoji: 🧣
       */
      "SCARF" = "🧣",
      /**
       * Emoji: 🧤
       */
      "GLOVES" = "🧤",
      /**
       * Emoji: 🧥
       *
       * Aliases: `JACKET`
       */
      "COAT" = "🧥",
      /**
       * Emoji: 🧥
       *
       * Aliases: `COAT`
       */
      "JACKET" = "🧥",
      /**
       * Emoji: 🧦
       */
      "SOCKS" = "🧦",
      /**
       * Emoji: 🧢
       *
       * Aliases: `CAP`,`BASEBALL_CAP`
       */
      "BILLED_CAP" = "🧢",
      /**
       * Emoji: 🧢
       *
       * Aliases: `BILLED_CAP`,`BASEBALL_CAP`
       */
      "CAP" = "🧢",
      /**
       * Emoji: 🧢
       *
       * Aliases: `BILLED_CAP`,`CAP`
       */
      "BASEBALL_CAP" = "🧢",
      /**
       * Emoji: 👨‍🦰
       *
       * Aliases: `MAN_RED_HAIR`,`MAN_REDHEAD`
       */
      "MAN_RED_HAIRED" = "👨‍🦰",
      /**
       * Emoji: 👨‍🦰
       *
       * Aliases: `MAN_RED_HAIRED`,`MAN_REDHEAD`
       */
      "MAN_RED_HAIR" = "👨‍🦰",
      /**
       * Emoji: 👨‍🦰
       *
       * Aliases: `MAN_RED_HAIRED`,`MAN_RED_HAIR`
       */
      "MAN_REDHEAD" = "👨‍🦰",
      /**
       * Emoji: 👩‍🦰
       *
       * Aliases: `WOMAN_RED_HAIR`,`WOMAN_REDHEAD`
       */
      "WOMAN_RED_HAIRED" = "👩‍🦰",
      /**
       * Emoji: 👩‍🦰
       *
       * Aliases: `WOMAN_RED_HAIRED`,`WOMAN_REDHEAD`
       */
      "WOMAN_RED_HAIR" = "👩‍🦰",
      /**
       * Emoji: 👩‍🦰
       *
       * Aliases: `WOMAN_RED_HAIRED`,`WOMAN_RED_HAIR`
       */
      "WOMAN_REDHEAD" = "👩‍🦰",
      /**
       * Emoji: 👩‍🦱
       *
       * Aliases: `WOMAN_CURLY_HAIR`
       */
      "WOMAN_CURLY_HAIRED" = "👩‍🦱",
      /**
       * Emoji: 👩‍🦱
       *
       * Aliases: `WOMAN_CURLY_HAIRED`
       */
      "WOMAN_CURLY_HAIR" = "👩‍🦱",
      /**
       * Emoji: 👨‍🦱
       *
       * Aliases: `MAN_CURLY_HAIR`
       */
      "MAN_CURLY_HAIRED" = "👨‍🦱",
      /**
       * Emoji: 👨‍🦱
       *
       * Aliases: `MAN_CURLY_HAIRED`
       */
      "MAN_CURLY_HAIR" = "👨‍🦱",
      /**
       * Emoji: 👩‍🦳
       *
       * Aliases: `WOMAN_WHITE_HAIR`
       */
      "WOMAN_WHITE_HAIRED" = "👩‍🦳",
      /**
       * Emoji: 👩‍🦳
       *
       * Aliases: `WOMAN_WHITE_HAIRED`
       */
      "WOMAN_WHITE_HAIR" = "👩‍🦳",
      /**
       * Emoji: 👨‍🦳
       *
       * Aliases: `MAN_WHITE_HAIR`
       */
      "MAN_WHITE_HAIRED" = "👨‍🦳",
      /**
       * Emoji: 👨‍🦳
       *
       * Aliases: `MAN_WHITE_HAIRED`
       */
      "MAN_WHITE_HAIR" = "👨‍🦳",
      /**
       * Emoji: 👩‍🦲
       *
       * Aliases: `BALD_WOMAN`
       */
      "WOMAN_BALD" = "👩‍🦲",
      /**
       * Emoji: 👩‍🦲
       *
       * Aliases: `WOMAN_BALD`
       */
      "BALD_WOMAN" = "👩‍🦲",
      /**
       * Emoji: 👨‍🦲
       *
       * Aliases: `BALD_MAN`
       */
      "MAN_BALD" = "👨‍🦲",
      /**
       * Emoji: 👨‍🦲
       *
       * Aliases: `MAN_BALD`
       */
      "BALD_MAN" = "👨‍🦲",
      /**
       * Emoji: 🦸
       */
      "SUPERHERO" = "🦸",
      /**
       * Emoji: 🦸‍♂️
       */
      "MAN_SUPERHERO" = "🦸‍♂️",
      /**
       * Emoji: 🦸‍♀️
       */
      "WOMAN_SUPERHERO" = "🦸‍♀️",
      /**
       * Emoji: 🦹
       */
      "SUPERVILLAIN" = "🦹",
      /**
       * Emoji: 🦹‍♂️
       */
      "MAN_SUPERVILLAIN" = "🦹‍♂️",
      /**
       * Emoji: 🦹‍♀️
       */
      "WOMAN_SUPERVILLAIN" = "🦹‍♀️",
      /**
       * Emoji: 🦵
       *
       * Aliases: `KICK`
       */
      "LEG" = "🦵",
      /**
       * Emoji: 🦵
       *
       * Aliases: `LEG`
       */
      "KICK" = "🦵",
      /**
       * Emoji: 🦶
       *
       * Aliases: `STOMP`
       */
      "FOOT" = "🦶",
      /**
       * Emoji: 🦶
       *
       * Aliases: `FOOT`
       */
      "STOMP" = "🦶",
      /**
       * Emoji: 🦴
       */
      "BONE" = "🦴",
      /**
       * Emoji: 🦷
       */
      "TOOTH" = "🦷",
      /**
       * Emoji: 🥽
       *
       * Aliases: `SAFETY_GOGGLES`
       */
      "GOGGLES" = "🥽",
      /**
       * Emoji: 🥽
       *
       * Aliases: `GOGGLES`
       */
      "SAFETY_GOGGLES" = "🥽",
      /**
       * Emoji: 🥼
       *
       * Aliases: `LABCOAT`,`DOCTOR`,`SCIENTIST`
       */
      "LAB_COAT" = "🥼",
      /**
       * Emoji: 🥼
       *
       * Aliases: `LAB_COAT`,`DOCTOR`,`SCIENTIST`
       */
      "LABCOAT" = "🥼",
      /**
       * Emoji: 🥼
       *
       * Aliases: `LAB_COAT`,`LABCOAT`,`SCIENTIST`
       */
      "DOCTOR" = "🥼",
      /**
       * Emoji: 🧑‍🔬
       */
      "SCIENTIST" = "🧑‍🔬",
      /**
       * Emoji: 🥾
       */
      "HIKING_BOOT" = "🥾",
      /**
       * Emoji: 🥿
       *
       * Aliases: `FLAT_SHOE`,`SLIPPER`
       */
      "WOMANS_FLAT_SHOE" = "🥿",
      /**
       * Emoji: 🥿
       *
       * Aliases: `WOMANS_FLAT_SHOE`,`SLIPPER`
       */
      "FLAT_SHOE" = "🥿",
      /**
       * Emoji: 🥿
       *
       * Aliases: `WOMANS_FLAT_SHOE`,`FLAT_SHOE`
       */
      "SLIPPER" = "🥿",
      /**
       * Emoji: 🤵‍♀️
       */
      "WOMAN_IN_TUXEDO" = "🤵‍♀️",
      /**
       * Emoji: 🕴️‍♀️
       */
      "WOMAN_LEVITATE" = "🕴️‍♀️",
      /**
       * Emoji: 👨‍⚕️
       *
       * Aliases: `MAN_DOCTOR`
       */
      "MAN_HEALTH_WORKER" = "👨‍⚕️",
      /**
       * Emoji: 👨‍⚕️
       *
       * Aliases: `MAN_HEALTH_WORKER`
       */
      "MAN_DOCTOR" = "👨‍⚕️",
      /**
       * Emoji: 👩‍⚕️
       *
       * Aliases: `WOMAN_DOCTOR`
       */
      "WOMAN_HEALTH_WORKER" = "👩‍⚕️",
      /**
       * Emoji: 👩‍⚕️
       *
       * Aliases: `WOMAN_HEALTH_WORKER`
       */
      "WOMAN_DOCTOR" = "👩‍⚕️",
      /**
       * Emoji: 👨‍🎓
       */
      "MAN_STUDENT" = "👨‍🎓",
      /**
       * Emoji: 👩‍🎓
       */
      "WOMAN_STUDENT" = "👩‍🎓",
      /**
       * Emoji: 👨‍🏫
       */
      "MAN_TEACHER" = "👨‍🏫",
      /**
       * Emoji: 👩‍🏫
       */
      "WOMAN_TEACHER" = "👩‍🏫",
      /**
       * Emoji: 👨‍⚖️
       */
      "MAN_JUDGE" = "👨‍⚖️",
      /**
       * Emoji: 👩‍⚖️
       */
      "WOMAN_JUDGE" = "👩‍⚖️",
      /**
       * Emoji: 👨‍🌾
       */
      "MAN_FARMER" = "👨‍🌾",
      /**
       * Emoji: 👩‍🌾
       */
      "WOMAN_FARMER" = "👩‍🌾",
      /**
       * Emoji: 👨‍🍳
       */
      "MAN_COOK" = "👨‍🍳",
      /**
       * Emoji: 👩‍🍳
       */
      "WOMAN_COOK" = "👩‍🍳",
      /**
       * Emoji: 👨‍🔧
       */
      "MAN_MECHANIC" = "👨‍🔧",
      /**
       * Emoji: 👩‍🔧
       */
      "WOMAN_MECHANIC" = "👩‍🔧",
      /**
       * Emoji: 👨‍🏭
       */
      "MAN_FACTORY_WORKER" = "👨‍🏭",
      /**
       * Emoji: 👩‍🏭
       */
      "WOMAN_FACTORY_WORKER" = "👩‍🏭",
      /**
       * Emoji: 👨‍💼
       *
       * Aliases: `BUSINESSWOMAN`
       */
      "MAN_OFFICE_WORKER" = "👨‍💼",
      /**
       * Emoji: 👩‍💼
       *
       * Aliases: `WOMAN_OFFICE_WORKER`
       */
      "BUSINESSWOMAN" = "👩‍💼",
      /**
       * Emoji: 👩‍💼
       *
       * Aliases: `BUSINESSWOMAN`
       */
      "WOMAN_OFFICE_WORKER" = "👩‍💼",
      /**
       * Emoji: 👨‍🔬
       */
      "MAN_SCIENTIST" = "👨‍🔬",
      /**
       * Emoji: 👩‍🔬
       */
      "WOMAN_SCIENTIST" = "👩‍🔬",
      /**
       * Emoji: 👨‍💻
       *
       * Aliases: `MAN_BLOGGER`
       */
      "MAN_TECHNOLOGIST" = "👨‍💻",
      /**
       * Emoji: 👨‍💻
       *
       * Aliases: `MAN_TECHNOLOGIST`
       */
      "MAN_BLOGGER" = "👨‍💻",
      /**
       * Emoji: 👩‍💻
       *
       * Aliases: `WOMAN_BLOGGER`
       */
      "WOMAN_TECHNOLOGIST" = "👩‍💻",
      /**
       * Emoji: 👩‍💻
       *
       * Aliases: `WOMAN_TECHNOLOGIST`
       */
      "WOMAN_BLOGGER" = "👩‍💻",
      /**
       * Emoji: 👨‍🎤
       */
      "MAN_SINGER" = "👨‍🎤",
      /**
       * Emoji: 👩‍🎤
       */
      "WOMAN_SINGER" = "👩‍🎤",
      /**
       * Emoji: 👨‍🎨
       */
      "MAN_ARTIST" = "👨‍🎨",
      /**
       * Emoji: 👩‍🎨
       */
      "WOMAN_ARTIST" = "👩‍🎨",
      /**
       * Emoji: 👨‍✈️
       */
      "MAN_PILOT" = "👨‍✈️",
      /**
       * Emoji: 👩‍✈️
       */
      "WOMAN_PILOT" = "👩‍✈️",
      /**
       * Emoji: 👨‍🚀
       */
      "MAN_ASTRONAUT" = "👨‍🚀",
      /**
       * Emoji: 👩‍🚀
       */
      "WOMAN_ASTRONAUT" = "👩‍🚀",
      /**
       * Emoji: 👨‍🚒
       */
      "MAN_FIREFIGHTER" = "👨‍🚒",
      /**
       * Emoji: 👩‍🚒
       */
      "WOMAN_FIREFIGHTER" = "👩‍🚒",
      /**
       * Emoji: 👮‍♂️
       *
       * Aliases: `POLICEMAN`
       */
      "MAN_POLICE_OFFICER" = "👮‍♂️",
      /**
       * Emoji: 👮‍♂️
       *
       * Aliases: `MAN_POLICE_OFFICER`
       */
      "POLICEMAN" = "👮‍♂️",
      /**
       * Emoji: 👮‍♀️
       *
       * Aliases: `POLICEWOMAN`
       */
      "WOMAN_POLICE_OFFICER" = "👮‍♀️",
      /**
       * Emoji: 👮‍♀️
       *
       * Aliases: `WOMAN_POLICE_OFFICER`
       */
      "POLICEWOMAN" = "👮‍♀️",
      /**
       * Emoji: 🕵️‍♂️
       *
       * Aliases: `MAN_SPY`,`MAN_SLEUTH`
       */
      "MAN_DETECTIVE" = "🕵️‍♂️",
      /**
       * Emoji: 🕵️‍♂️
       *
       * Aliases: `MAN_DETECTIVE`,`MAN_SLEUTH`
       */
      "MAN_SPY" = "🕵️‍♂️",
      /**
       * Emoji: 🕵️‍♂️
       *
       * Aliases: `MAN_DETECTIVE`,`MAN_SPY`
       */
      "MAN_SLEUTH" = "🕵️‍♂️",
      /**
       * Emoji: 🕵️‍♀️
       *
       * Aliases: `WOMAN_SPY`,`WOMAN_SLEUTH`
       */
      "WOMAN_DETECTIVE" = "🕵️‍♀️",
      /**
       * Emoji: 🕵️‍♀️
       *
       * Aliases: `WOMAN_DETECTIVE`,`WOMAN_SLEUTH`
       */
      "WOMAN_SPY" = "🕵️‍♀️",
      /**
       * Emoji: 🕵️‍♀️
       *
       * Aliases: `WOMAN_DETECTIVE`,`WOMAN_SPY`
       */
      "WOMAN_SLEUTH" = "🕵️‍♀️",
      /**
       * Emoji: 💂‍♂️
       *
       * Aliases: `GUARDSMAN`
       */
      "MAN_GUARD" = "💂‍♂️",
      /**
       * Emoji: 💂‍♂️
       *
       * Aliases: `MAN_GUARD`
       */
      "GUARDSMAN" = "💂‍♂️",
      /**
       * Emoji: 💂‍♀️
       *
       * Aliases: `GUARDSWOMAN`
       */
      "WOMAN_GUARD" = "💂‍♀️",
      /**
       * Emoji: 💂‍♀️
       *
       * Aliases: `WOMAN_GUARD`
       */
      "GUARDSWOMAN" = "💂‍♀️",
      /**
       * Emoji: 👷‍♂️
       */
      "MAN_CONSTRUCTION_WORKER" = "👷‍♂️",
      /**
       * Emoji: 👷‍♀️
       */
      "WOMAN_CONSTRUCTION_WORKER" = "👷‍♀️",
      /**
       * Emoji: 👳‍♂️
       *
       * Aliases: `MAN_WITH_TURBAN`
       */
      "MAN_WEARING_TURBAN" = "👳‍♂️",
      /**
       * Emoji: 👳‍♂️
       *
       * Aliases: `MAN_WEARING_TURBAN`
       */
      "MAN_WITH_TURBAN" = "👳‍♂️",
      /**
       * Emoji: 👳‍♀️
       *
       * Aliases: `WOMAN_WITH_TURBAN`
       */
      "WOMAN_WEARING_TURBAN" = "👳‍♀️",
      /**
       * Emoji: 👳‍♀️
       *
       * Aliases: `WOMAN_WEARING_TURBAN`
       */
      "WOMAN_WITH_TURBAN" = "👳‍♀️",
      /**
       * Emoji: 👱‍♂️
       *
       * Aliases: `MAN_WITH_BLOND_HAIR`
       */
      "BLOND_HAIRED_MAN" = "👱‍♂️",
      /**
       * Emoji: 👱‍♂️
       *
       * Aliases: `BLOND_HAIRED_MAN`
       */
      "MAN_WITH_BLOND_HAIR" = "👱‍♂️",
      /**
       * Emoji: 👱‍♀️
       *
       * Aliases: `WOMAN_WITH_BLOND_HAIR`
       */
      "BLOND_HAIRED_WOMAN" = "👱‍♀️",
      /**
       * Emoji: 👱‍♀️
       *
       * Aliases: `BLOND_HAIRED_WOMAN`
       */
      "WOMAN_WITH_BLOND_HAIR" = "👱‍♀️",
      /**
       * Emoji: 🙍‍♂️
       */
      "MAN_FROWNING" = "🙍‍♂️",
      /**
       * Emoji: 🙍‍♀️
       */
      "WOMAN_FROWNING" = "🙍‍♀️",
      /**
       * Emoji: 🙎‍♂️
       */
      "MAN_POUTING" = "🙎‍♂️",
      /**
       * Emoji: 🙎‍♀️
       */
      "WOMAN_POUTING" = "🙎‍♀️",
      /**
       * Emoji: 🙅‍♂️
       *
       * Aliases: `MAN_NO`
       */
      "MAN_GESTURING_NO" = "🙅‍♂️",
      /**
       * Emoji: 🙅‍♂️
       *
       * Aliases: `MAN_GESTURING_NO`
       */
      "MAN_NO" = "🙅‍♂️",
      /**
       * Emoji: 🙅‍♀️
       *
       * Aliases: `WOMAN_NO`
       */
      "WOMAN_GESTURING_NO" = "🙅‍♀️",
      /**
       * Emoji: 🙅‍♀️
       *
       * Aliases: `WOMAN_GESTURING_NO`
       */
      "WOMAN_NO" = "🙅‍♀️",
      /**
       * Emoji: 🙆‍♂️
       *
       * Aliases: `MAN_OK`,`OK_MAN`
       */
      "MAN_GESTURING_OK" = "🙆‍♂️",
      /**
       * Emoji: 🙆‍♂️
       *
       * Aliases: `MAN_GESTURING_OK`,`OK_MAN`
       */
      "MAN_OK" = "🙆‍♂️",
      /**
       * Emoji: 🙆‍♂️
       *
       * Aliases: `MAN_GESTURING_OK`,`MAN_OK`
       */
      "OK_MAN" = "🙆‍♂️",
      /**
       * Emoji: 🙆‍♀️
       *
       * Aliases: `WOMAN_OK`,`OK_WOMAN`
       */
      "WOMAN_GESTURING_OK" = "🙆‍♀️",
      /**
       * Emoji: 🙆‍♀️
       *
       * Aliases: `WOMAN_GESTURING_OK`,`OK_WOMAN`
       */
      "WOMAN_OK" = "🙆‍♀️",
      /**
       * Emoji: 🙆‍♀️
       *
       * Aliases: `WOMAN_GESTURING_OK`,`WOMAN_OK`
       */
      "OK_WOMAN" = "🙆‍♀️",
      /**
       * Emoji: 💁‍♂️
       *
       * Aliases: `INFORMATION_DESK_MAN`
       */
      "MAN_TIPPING_HAND" = "💁‍♂️",
      /**
       * Emoji: 💁‍♂️
       *
       * Aliases: `MAN_TIPPING_HAND`
       */
      "INFORMATION_DESK_MAN" = "💁‍♂️",
      /**
       * Emoji: 💁‍♀️
       *
       * Aliases: `INFORMATION_DESK_WOMAN`
       */
      "WOMAN_TIPPING_HAND" = "💁‍♀️",
      /**
       * Emoji: 💁‍♀️
       *
       * Aliases: `WOMAN_TIPPING_HAND`
       */
      "INFORMATION_DESK_WOMAN" = "💁‍♀️",
      /**
       * Emoji: 🙋‍♂️
       */
      "MAN_RAISING_HAND" = "🙋‍♂️",
      /**
       * Emoji: 🙋‍♀️
       */
      "WOMAN_RAISING_HAND" = "🙋‍♀️",
      /**
       * Emoji: 🙇‍♂️
       */
      "MAN_BOWING" = "🙇‍♂️",
      /**
       * Emoji: 🙇‍♀️
       */
      "WOMAN_BOWING" = "🙇‍♀️",
      /**
       * Emoji: 🤦‍♂️
       *
       * Aliases: `MAN_FACE_PALM`
       */
      "MAN_FACEPALMING" = "🤦‍♂️",
      /**
       * Emoji: 🤦‍♂️
       *
       * Aliases: `MAN_FACEPALMING`
       */
      "MAN_FACE_PALM" = "🤦‍♂️",
      /**
       * Emoji: 🤦‍♀️
       *
       * Aliases: `WOMAN_FACE_PALM`
       */
      "WOMAN_FACEPALMING" = "🤦‍♀️",
      /**
       * Emoji: 🤦‍♀️
       *
       * Aliases: `WOMAN_FACEPALMING`
       */
      "WOMAN_FACE_PALM" = "🤦‍♀️",
      /**
       * Emoji: 🤷‍♂️
       *
       * Aliases: `MAN_SHRUG`
       */
      "MAN_SHRUGGING" = "🤷‍♂️",
      /**
       * Emoji: 🤷‍♂️
       *
       * Aliases: `MAN_SHRUGGING`
       */
      "MAN_SHRUG" = "🤷‍♂️",
      /**
       * Emoji: 🤷‍♀️
       *
       * Aliases: `WOMAN_SHRUG`
       */
      "WOMAN_SHRUGGING" = "🤷‍♀️",
      /**
       * Emoji: 🤷‍♀️
       *
       * Aliases: `WOMAN_SHRUGGING`
       */
      "WOMAN_SHRUG" = "🤷‍♀️",
      /**
       * Emoji: 🥱
       */
      "YAWNING_FACE" = "🥱",
      /**
       * Emoji: 🤏
       */
      "PINCHING_HAND" = "🤏",
      /**
       * Emoji: 🦾
       */
      "MECHANICAL_ARM" = "🦾",
      /**
       * Emoji: 🦿
       */
      "MECHANICAL_LEG" = "🦿",
      /**
       * Emoji: 🧏
       */
      "DEAF_PERSON" = "🧏",
      /**
       * Emoji: 🧏‍♂️
       */
      "DEAF_MAN" = "🧏‍♂️",
      /**
       * Emoji: 🧏‍♀️
       */
      "DEAF_WOMAN" = "🧏‍♀️",
      /**
       * Emoji: 🧍
       */
      "PERSON_STANDING" = "🧍",
      /**
       * Emoji: 🧍‍♂️
       */
      "MAN_STANDING" = "🧍‍♂️",
      /**
       * Emoji: 🧍‍♀️
       */
      "WOMAN_STANDING" = "🧍‍♀️",
      /**
       * Emoji: 🧎
       */
      "PERSON_KNEELING" = "🧎",
      /**
       * Emoji: 🧎‍♂️
       */
      "MAN_KNEELING" = "🧎‍♂️",
      /**
       * Emoji: 🧎‍♀️
       */
      "WOMAN_KNEELING" = "🧎‍♀️",
      /**
       * Emoji: 👨‍🦯
       */
      "MAN_WITH_PROBING_CANE" = "👨‍🦯",
      /**
       * Emoji: 👩‍🦯
       */
      "WOMAN_WITH_PROBING_CANE" = "👩‍🦯",
      /**
       * Emoji: 👨‍🦼
       */
      "MAN_IN_MOTORIZED_WHEELCHAIR" = "👨‍🦼",
      /**
       * Emoji: 👩‍🦼
       */
      "WOMAN_IN_MOTORIZED_WHEELCHAIR" = "👩‍🦼",
      /**
       * Emoji: 👨‍🦽
       */
      "MAN_IN_MANUAL_WHEELCHAIR" = "👨‍🦽",
      /**
       * Emoji: 👩‍🦽
       */
      "WOMAN_IN_MANUAL_WHEELCHAIR" = "👩‍🦽",
      /**
       * Emoji: 🧑‍🤝‍🧑
       */
      "PEOPLE_HOLDING_HANDS" = "🧑‍🤝‍🧑",
      /**
       * Emoji: 🧑‍🦰
       */
      "PERSON_RED_HAIRED" = "🧑‍🦰",
      /**
       * Emoji: 🧑‍🦱
       */
      "PERSON_CURLY_HAIRED" = "🧑‍🦱",
      /**
       * Emoji: 🧑‍🦳
       */
      "PERSON_WHITE_HAIRED" = "🧑‍🦳",
      /**
       * Emoji: 🧑‍🦲
       */
      "PERSON_BALD" = "🧑‍🦲",
      /**
       * Emoji: 🧑‍⚕️
       */
      "HEALTH_WORKER" = "🧑‍⚕️",
      /**
       * Emoji: 🧑‍🎓
       */
      "STUDENT" = "🧑‍🎓",
      /**
       * Emoji: 🧑‍🏫
       */
      "TEACHER" = "🧑‍🏫",
      /**
       * Emoji: 🧑‍⚖️
       */
      "JUDGE" = "🧑‍⚖️",
      /**
       * Emoji: 🧑‍🌾
       */
      "FARMER" = "🧑‍🌾",
      /**
       * Emoji: 🧑‍🍳
       */
      "COOK" = "🧑‍🍳",
      /**
       * Emoji: 🧰
       *
       * Aliases: `TOOLBOX`
       */
      "MECHANIC" = "🧰",
      /**
       * Emoji: 🧑‍🏭
       */
      "FACTORY_WORKER" = "🧑‍🏭",
      /**
       * Emoji: 🧑‍💼
       */
      "OFFICE_WORKER" = "🧑‍💼",
      /**
       * Emoji: 🧑‍💻
       */
      "TECHNOLOGIST" = "🧑‍💻",
      /**
       * Emoji: 🧑‍🎤
       */
      "SINGER" = "🧑‍🎤",
      /**
       * Emoji: 🧑‍🎨
       */
      "ARTIST" = "🧑‍🎨",
      /**
       * Emoji: 🧑‍✈️
       */
      "PILOT" = "🧑‍✈️",
      /**
       * Emoji: 🧑‍🚀
       */
      "ASTRONAUT" = "🧑‍🚀",
      /**
       * Emoji: 🧑‍🚒
       */
      "FIREFIGHTER" = "🧑‍🚒",
      /**
       * Emoji: 🧑‍🦯
       */
      "PERSON_WITH_PROBING_CANE" = "🧑‍🦯",
      /**
       * Emoji: 🧑‍🦼
       */
      "PERSON_IN_MOTORIZED_WHEELCHAIR" = "🧑‍🦼",
      /**
       * Emoji: 🧑‍🦽
       */
      "PERSON_IN_MANUAL_WHEELCHAIR" = "🧑‍🦽",
      /**
       * Emoji: 🧵
       *
       * Aliases: `SPOOL`,`STRING`
       */
      "THREAD" = "🧵",
      /**
       * Emoji: 🧵
       *
       * Aliases: `THREAD`,`STRING`
       */
      "SPOOL" = "🧵",
      /**
       * Emoji: 🧵
       *
       * Aliases: `THREAD`,`SPOOL`
       */
      "STRING" = "🧵",
      /**
       * Emoji: 🧶
       *
       * Aliases: `CROCHET`,`KNIT`
       */
      "YARN" = "🧶",
      /**
       * Emoji: 🧶
       *
       * Aliases: `YARN`,`KNIT`
       */
      "CROCHET" = "🧶",
      /**
       * Emoji: 🧶
       *
       * Aliases: `YARN`,`CROCHET`
       */
      "KNIT" = "🧶",
      /**
       * Emoji: 🤿
       */
      "DIVING_MASK" = "🤿",
      /**
       * Emoji: 🦺
       */
      "SAFETY_VEST" = "🦺",
      /**
       * Emoji: 🥻
       */
      "SARI" = "🥻",
      /**
       * Emoji: 🩱
       */
      "ONE_PIECE_SWIMSUIT" = "🩱",
      /**
       * Emoji: 🩲
       */
      "BRIEFS" = "🩲",
      /**
       * Emoji: 🩳
       */
      "SHORTS" = "🩳",
      /**
       * Emoji: 🩰
       */
      "BALLET_SHOES" = "🩰",
      /**
       * Emoji: 🪕
       */
      "BANJO" = "🪕",
      /**
       * Emoji: 🐶
       */
      "DOG" = "🐶",
      /**
       * Emoji: 🐱
       */
      "CAT" = "🐱",
      /**
       * Emoji: 🐭
       */
      "MOUSE" = "🐭",
      /**
       * Emoji: 🐹
       */
      "HAMSTER" = "🐹",
      /**
       * Emoji: 🐰
       */
      "RABBIT" = "🐰",
      /**
       * Emoji: 🐻
       */
      "BEAR" = "🐻",
      /**
       * Emoji: 🐼
       */
      "PANDA_FACE" = "🐼",
      /**
       * Emoji: 🐨
       */
      "KOALA" = "🐨",
      /**
       * Emoji: 🐯
       */
      "TIGER" = "🐯",
      /**
       * Emoji: 🦁
       *
       * Aliases: `LION`
       */
      "LION_FACE" = "🦁",
      /**
       * Emoji: 🦁
       *
       * Aliases: `LION_FACE`
       */
      "LION" = "🦁",
      /**
       * Emoji: 🐮
       */
      "COW" = "🐮",
      /**
       * Emoji: 🐷
       */
      "PIG" = "🐷",
      /**
       * Emoji: 🐽
       */
      "PIG_NOSE" = "🐽",
      /**
       * Emoji: 🐸
       */
      "FROG" = "🐸",
      /**
       * Emoji: 🐙
       */
      "OCTOPUS" = "🐙",
      /**
       * Emoji: 🐵
       */
      "MONKEY_FACE" = "🐵",
      /**
       * Emoji: 🙈
       */
      "SEE_NO_EVIL" = "🙈",
      /**
       * Emoji: 🙉
       */
      "HEAR_NO_EVIL" = "🙉",
      /**
       * Emoji: 🙊
       */
      "SPEAK_NO_EVIL" = "🙊",
      /**
       * Emoji: 🐒
       */
      "MONKEY" = "🐒",
      /**
       * Emoji: 🐔
       */
      "CHICKEN" = "🐔",
      /**
       * Emoji: 🐧
       */
      "PENGUIN" = "🐧",
      /**
       * Emoji: 🐦
       */
      "BIRD" = "🐦",
      /**
       * Emoji: 🐤
       */
      "BABY_CHICK" = "🐤",
      /**
       * Emoji: 🐣
       */
      "HATCHING_CHICK" = "🐣",
      /**
       * Emoji: 🐥
       */
      "HATCHED_CHICK" = "🐥",
      /**
       * Emoji: 🐺
       */
      "WOLF" = "🐺",
      /**
       * Emoji: 🐗
       */
      "BOAR" = "🐗",
      /**
       * Emoji: 🐴
       */
      "HORSE" = "🐴",
      /**
       * Emoji: 🦄
       *
       * Aliases: `UNICORN_FACE`
       */
      "UNICORN" = "🦄",
      /**
       * Emoji: 🦄
       *
       * Aliases: `UNICORN`
       */
      "UNICORN_FACE" = "🦄",
      /**
       * Emoji: 🐝
       */
      "BEE" = "🐝",
      /**
       * Emoji: 🐛
       */
      "BUG" = "🐛",
      /**
       * Emoji: 🐌
       */
      "SNAIL" = "🐌",
      /**
       * Emoji: 🐞
       */
      "BEETLE" = "🐞",
      /**
       * Emoji: 🐜
       */
      "ANT" = "🐜",
      /**
       * Emoji: 🕷
       */
      "SPIDER" = "🕷",
      /**
       * Emoji: 🦂
       */
      "SCORPION" = "🦂",
      /**
       * Emoji: 🦀
       */
      "CRAB" = "🦀",
      /**
       * Emoji: 🐍
       */
      "SNAKE" = "🐍",
      /**
       * Emoji: 🐢
       */
      "TURTLE" = "🐢",
      /**
       * Emoji: 🐠
       */
      "TROPICAL_FISH" = "🐠",
      /**
       * Emoji: 🐟
       */
      "FISH" = "🐟",
      /**
       * Emoji: 🐡
       */
      "BLOWFISH" = "🐡",
      /**
       * Emoji: 🐬
       */
      "DOLPHIN" = "🐬",
      /**
       * Emoji: 🐳
       */
      "WHALE" = "🐳",
      /**
       * Emoji: 🐋
       */
      "WHALE2" = "🐋",
      /**
       * Emoji: 🐊
       */
      "CROCODILE" = "🐊",
      /**
       * Emoji: 🐆
       */
      "LEOPARD" = "🐆",
      /**
       * Emoji: 🐅
       */
      "TIGER2" = "🐅",
      /**
       * Emoji: 🐃
       */
      "WATER_BUFFALO" = "🐃",
      /**
       * Emoji: 🐂
       */
      "OX" = "🐂",
      /**
       * Emoji: 🐄
       */
      "COW2" = "🐄",
      /**
       * Emoji: 🐪
       */
      "DROMEDARY_CAMEL" = "🐪",
      /**
       * Emoji: 🐫
       */
      "CAMEL" = "🐫",
      /**
       * Emoji: 🐘
       */
      "ELEPHANT" = "🐘",
      /**
       * Emoji: 🐐
       */
      "GOAT" = "🐐",
      /**
       * Emoji: 🐏
       */
      "RAM" = "🐏",
      /**
       * Emoji: 🐑
       */
      "SHEEP" = "🐑",
      /**
       * Emoji: 🐎
       */
      "RACEHORSE" = "🐎",
      /**
       * Emoji: 🐖
       */
      "PIG2" = "🐖",
      /**
       * Emoji: 🐀
       */
      "RAT" = "🐀",
      /**
       * Emoji: 🐁
       */
      "MOUSE2" = "🐁",
      /**
       * Emoji: 🐓
       */
      "ROOSTER" = "🐓",
      /**
       * Emoji: 🦃
       */
      "TURKEY" = "🦃",
      /**
       * Emoji: 🕊
       *
       * Aliases: `DOVE_OF_PEACE`
       */
      "DOVE" = "🕊",
      /**
       * Emoji: 🕊
       *
       * Aliases: `DOVE`
       */
      "DOVE_OF_PEACE" = "🕊",
      /**
       * Emoji: 🐕
       */
      "DOG2" = "🐕",
      /**
       * Emoji: 🐩
       */
      "POODLE" = "🐩",
      /**
       * Emoji: 🐈
       */
      "CAT2" = "🐈",
      /**
       * Emoji: 🐇
       */
      "RABBIT2" = "🐇",
      /**
       * Emoji: 🐿
       */
      "CHIPMUNK" = "🐿",
      /**
       * Emoji: 🐾
       *
       * Aliases: `PAW_PRINTS`
       */
      "FEET" = "🐾",
      /**
       * Emoji: 🐾
       *
       * Aliases: `FEET`
       */
      "PAW_PRINTS" = "🐾",
      /**
       * Emoji: 🐉
       */
      "DRAGON" = "🐉",
      /**
       * Emoji: 🐲
       */
      "DRAGON_FACE" = "🐲",
      /**
       * Emoji: 🌵
       */
      "CACTUS" = "🌵",
      /**
       * Emoji: 🎄
       */
      "CHRISTMAS_TREE" = "🎄",
      /**
       * Emoji: 🌲
       */
      "EVERGREEN_TREE" = "🌲",
      /**
       * Emoji: 🌳
       */
      "DECIDUOUS_TREE" = "🌳",
      /**
       * Emoji: 🌴
       */
      "PALM_TREE" = "🌴",
      /**
       * Emoji: 🌱
       */
      "SEEDLING" = "🌱",
      /**
       * Emoji: 🌿
       */
      "HERB" = "🌿",
      /**
       * Emoji: ☘
       */
      "SHAMROCK" = "☘",
      /**
       * Emoji: 🍀
       */
      "FOUR_LEAF_CLOVER" = "🍀",
      /**
       * Emoji: 🎍
       */
      "BAMBOO" = "🎍",
      /**
       * Emoji: 🎋
       */
      "TANABATA_TREE" = "🎋",
      /**
       * Emoji: 🍃
       */
      "LEAVES" = "🍃",
      /**
       * Emoji: 🍂
       */
      "FALLEN_LEAF" = "🍂",
      /**
       * Emoji: 🍁
       */
      "MAPLE_LEAF" = "🍁",
      /**
       * Emoji: 🌾
       */
      "EAR_OF_RICE" = "🌾",
      /**
       * Emoji: 🌺
       */
      "HIBISCUS" = "🌺",
      /**
       * Emoji: 🌻
       */
      "SUNFLOWER" = "🌻",
      /**
       * Emoji: 🌹
       */
      "ROSE" = "🌹",
      /**
       * Emoji: 🌷
       */
      "TULIP" = "🌷",
      /**
       * Emoji: 🌼
       */
      "BLOSSOM" = "🌼",
      /**
       * Emoji: 🌸
       */
      "CHERRY_BLOSSOM" = "🌸",
      /**
       * Emoji: 💐
       */
      "BOUQUET" = "💐",
      /**
       * Emoji: 🍄
       */
      "MUSHROOM" = "🍄",
      /**
       * Emoji: 🌰
       */
      "CHESTNUT" = "🌰",
      /**
       * Emoji: 🎃
       */
      "JACK_O_LANTERN" = "🎃",
      /**
       * Emoji: 🐚
       */
      "SHELL" = "🐚",
      /**
       * Emoji: 🕸
       */
      "SPIDER_WEB" = "🕸",
      /**
       * Emoji: 🌎
       */
      "EARTH_AMERICAS" = "🌎",
      /**
       * Emoji: 🌍
       */
      "EARTH_AFRICA" = "🌍",
      /**
       * Emoji: 🌏
       */
      "EARTH_ASIA" = "🌏",
      /**
       * Emoji: 🌕
       */
      "FULL_MOON" = "🌕",
      /**
       * Emoji: 🌖
       */
      "WANING_GIBBOUS_MOON" = "🌖",
      /**
       * Emoji: 🌗
       */
      "LAST_QUARTER_MOON" = "🌗",
      /**
       * Emoji: 🌘
       */
      "WANING_CRESCENT_MOON" = "🌘",
      /**
       * Emoji: 🌑
       */
      "NEW_MOON" = "🌑",
      /**
       * Emoji: 🌒
       */
      "WAXING_CRESCENT_MOON" = "🌒",
      /**
       * Emoji: 🌓
       */
      "FIRST_QUARTER_MOON" = "🌓",
      /**
       * Emoji: 🌔
       */
      "WAXING_GIBBOUS_MOON" = "🌔",
      /**
       * Emoji: 🌚
       */
      "NEW_MOON_WITH_FACE" = "🌚",
      /**
       * Emoji: 🌝
       */
      "FULL_MOON_WITH_FACE" = "🌝",
      /**
       * Emoji: 🌛
       */
      "FIRST_QUARTER_MOON_WITH_FACE" = "🌛",
      /**
       * Emoji: 🌜
       */
      "LAST_QUARTER_MOON_WITH_FACE" = "🌜",
      /**
       * Emoji: 🌞
       */
      "SUN_WITH_FACE" = "🌞",
      /**
       * Emoji: 🌙
       */
      "CRESCENT_MOON" = "🌙",
      /**
       * Emoji: ⭐
       */
      "STAR" = "⭐",
      /**
       * Emoji: 🌟
       */
      "STAR2" = "🌟",
      /**
       * Emoji: 💫
       */
      "DIZZY" = "💫",
      /**
       * Emoji: ✨
       */
      "SPARKLES" = "✨",
      /**
       * Emoji: ☄
       */
      "COMET" = "☄",
      /**
       * Emoji: ☀
       */
      "SUNNY" = "☀",
      /**
       * Emoji: 🌤
       *
       * Aliases: `WHITE_SUN_WITH_SMALL_CLOUD`
       */
      "WHITE_SUN_SMALL_CLOUD" = "🌤",
      /**
       * Emoji: 🌤
       *
       * Aliases: `WHITE_SUN_SMALL_CLOUD`
       */
      "WHITE_SUN_WITH_SMALL_CLOUD" = "🌤",
      /**
       * Emoji: ⛅
       */
      "PARTLY_SUNNY" = "⛅",
      /**
       * Emoji: 🌥
       *
       * Aliases: `WHITE_SUN_BEHIND_CLOUD`
       */
      "WHITE_SUN_CLOUD" = "🌥",
      /**
       * Emoji: 🌥
       *
       * Aliases: `WHITE_SUN_CLOUD`
       */
      "WHITE_SUN_BEHIND_CLOUD" = "🌥",
      /**
       * Emoji: 🌦
       *
       * Aliases: `WHITE_SUN_BEHIND_CLOUD_WITH_RAIN`
       */
      "WHITE_SUN_RAIN_CLOUD" = "🌦",
      /**
       * Emoji: 🌦
       *
       * Aliases: `WHITE_SUN_RAIN_CLOUD`
       */
      "WHITE_SUN_BEHIND_CLOUD_WITH_RAIN" = "🌦",
      /**
       * Emoji: ☁
       */
      "CLOUD" = "☁",
      /**
       * Emoji: 🌧
       *
       * Aliases: `CLOUD_WITH_RAIN`
       */
      "CLOUD_RAIN" = "🌧",
      /**
       * Emoji: 🌧
       *
       * Aliases: `CLOUD_RAIN`
       */
      "CLOUD_WITH_RAIN" = "🌧",
      /**
       * Emoji: ⛈
       *
       * Aliases: `THUNDER_CLOUD_AND_RAIN`
       */
      "THUNDER_CLOUD_RAIN" = "⛈",
      /**
       * Emoji: ⛈
       *
       * Aliases: `THUNDER_CLOUD_RAIN`
       */
      "THUNDER_CLOUD_AND_RAIN" = "⛈",
      /**
       * Emoji: 🌩
       *
       * Aliases: `CLOUD_WITH_LIGHTNING`
       */
      "CLOUD_LIGHTNING" = "🌩",
      /**
       * Emoji: 🌩
       *
       * Aliases: `CLOUD_LIGHTNING`
       */
      "CLOUD_WITH_LIGHTNING" = "🌩",
      /**
       * Emoji: ⚡
       */
      "ZAP" = "⚡",
      /**
       * Emoji: 🔥
       *
       * Aliases: `FLAME`
       */
      "FIRE" = "🔥",
      /**
       * Emoji: 🔥
       *
       * Aliases: `FIRE`
       */
      "FLAME" = "🔥",
      /**
       * Emoji: 💥
       */
      "BOOM" = "💥",
      /**
       * Emoji: ❄
       */
      "SNOWFLAKE" = "❄",
      /**
       * Emoji: 🌨
       *
       * Aliases: `CLOUD_WITH_SNOW`
       */
      "CLOUD_SNOW" = "🌨",
      /**
       * Emoji: 🌨
       *
       * Aliases: `CLOUD_SNOW`
       */
      "CLOUD_WITH_SNOW" = "🌨",
      /**
       * Emoji: ☃
       */
      "SNOWMAN2" = "☃",
      /**
       * Emoji: ⛄
       */
      "SNOWMAN" = "⛄",
      /**
       * Emoji: 🌬
       */
      "WIND_BLOWING_FACE" = "🌬",
      /**
       * Emoji: 💨
       */
      "DASH" = "💨",
      /**
       * Emoji: 🌪
       *
       * Aliases: `CLOUD_WITH_TORNADO`
       */
      "CLOUD_TORNADO" = "🌪",
      /**
       * Emoji: 🌪
       *
       * Aliases: `CLOUD_TORNADO`
       */
      "CLOUD_WITH_TORNADO" = "🌪",
      /**
       * Emoji: 🌫
       */
      "FOG" = "🌫",
      /**
       * Emoji: ☂
       */
      "UMBRELLA2" = "☂",
      /**
       * Emoji: ☔
       */
      "UMBRELLA" = "☔",
      /**
       * Emoji: 💧
       */
      "DROPLET" = "💧",
      /**
       * Emoji: 💦
       */
      "SWEAT_DROPS" = "💦",
      /**
       * Emoji: 🌊
       */
      "OCEAN" = "🌊",
      /**
       * Emoji: 🦅
       */
      "EAGLE" = "🦅",
      /**
       * Emoji: 🦆
       */
      "DUCK" = "🦆",
      /**
       * Emoji: 🦇
       */
      "BAT" = "🦇",
      /**
       * Emoji: 🦈
       */
      "SHARK" = "🦈",
      /**
       * Emoji: 🦉
       */
      "OWL" = "🦉",
      /**
       * Emoji: 🦊
       *
       * Aliases: `FOX_FACE`
       */
      "FOX" = "🦊",
      /**
       * Emoji: 🦊
       *
       * Aliases: `FOX`
       */
      "FOX_FACE" = "🦊",
      /**
       * Emoji: 🦋
       */
      "BUTTERFLY" = "🦋",
      /**
       * Emoji: 🦌
       */
      "DEER" = "🦌",
      /**
       * Emoji: 🦍
       */
      "GORILLA" = "🦍",
      /**
       * Emoji: 🦎
       */
      "LIZARD" = "🦎",
      /**
       * Emoji: 🦏
       *
       * Aliases: `RHINOCEROS`
       */
      "RHINO" = "🦏",
      /**
       * Emoji: 🦏
       *
       * Aliases: `RHINO`
       */
      "RHINOCEROS" = "🦏",
      /**
       * Emoji: 🥀
       *
       * Aliases: `WILTED_FLOWER`
       */
      "WILTED_ROSE" = "🥀",
      /**
       * Emoji: 🥀
       *
       * Aliases: `WILTED_ROSE`
       */
      "WILTED_FLOWER" = "🥀",
      /**
       * Emoji: 🦐
       */
      "SHRIMP" = "🦐",
      /**
       * Emoji: 🦑
       */
      "SQUID" = "🦑",
      /**
       * Emoji: 🦝
       */
      "RACCOON" = "🦝",
      /**
       * Emoji: 🦙
       *
       * Aliases: `ALPACA`,`WOOL`
       */
      "LLAMA" = "🦙",
      /**
       * Emoji: 🦙
       *
       * Aliases: `LLAMA`,`WOOL`
       */
      "ALPACA" = "🦙",
      /**
       * Emoji: 🦙
       *
       * Aliases: `LLAMA`,`ALPACA`
       */
      "WOOL" = "🦙",
      /**
       * Emoji: 🦛
       *
       * Aliases: `HIPPO`
       */
      "HIPPOPOTAMUS" = "🦛",
      /**
       * Emoji: 🦛
       *
       * Aliases: `HIPPOPOTAMUS`
       */
      "HIPPO" = "🦛",
      /**
       * Emoji: 🦘
       *
       * Aliases: `AUSTRALIA`,`JUMP`,`MARSUPIAL`
       */
      "KANGAROO" = "🦘",
      /**
       * Emoji: 🦘
       *
       * Aliases: `KANGAROO`,`JUMP`,`MARSUPIAL`
       */
      "AUSTRALIA" = "🦘",
      /**
       * Emoji: 🦘
       *
       * Aliases: `KANGAROO`,`AUSTRALIA`,`MARSUPIAL`
       */
      "JUMP" = "🦘",
      /**
       * Emoji: 🦘
       *
       * Aliases: `KANGAROO`,`AUSTRALIA`,`JUMP`
       */
      "MARSUPIAL" = "🦘",
      /**
       * Emoji: 🦡
       *
       * Aliases: `HONEY_BADGER`
       */
      "BADGER" = "🦡",
      /**
       * Emoji: 🦡
       *
       * Aliases: `BADGER`
       */
      "HONEY_BADGER" = "🦡",
      /**
       * Emoji: 🦢
       *
       * Aliases: `CYGNET`
       */
      "SWAN" = "🦢",
      /**
       * Emoji: 🦢
       *
       * Aliases: `SWAN`
       */
      "CYGNET" = "🦢",
      /**
       * Emoji: 🦚
       *
       * Aliases: `PEAHEN`
       */
      "PEACOCK" = "🦚",
      /**
       * Emoji: 🦚
       *
       * Aliases: `PEACOCK`
       */
      "PEAHEN" = "🦚",
      /**
       * Emoji: 🦜
       */
      "PARROT" = "🦜",
      /**
       * Emoji: 🦞
       *
       * Aliases: `BISQUE`,`SEAFOOD`
       */
      "LOBSTER" = "🦞",
      /**
       * Emoji: 🦞
       *
       * Aliases: `LOBSTER`,`SEAFOOD`
       */
      "BISQUE" = "🦞",
      /**
       * Emoji: 🦞
       *
       * Aliases: `LOBSTER`,`BISQUE`
       */
      "SEAFOOD" = "🦞",
      /**
       * Emoji: 🦟
       *
       * Aliases: `INSECT`,`DISEASE`,`MALARIA`,`FEVER`
       */
      "MOSQUITO" = "🦟",
      /**
       * Emoji: 🦟
       *
       * Aliases: `MOSQUITO`,`DISEASE`,`MALARIA`,`FEVER`
       */
      "INSECT" = "🦟",
      /**
       * Emoji: 🦟
       *
       * Aliases: `MOSQUITO`,`INSECT`,`MALARIA`,`FEVER`
       */
      "DISEASE" = "🦟",
      /**
       * Emoji: 🦟
       *
       * Aliases: `MOSQUITO`,`INSECT`,`DISEASE`,`FEVER`
       */
      "MALARIA" = "🦟",
      /**
       * Emoji: 🦟
       *
       * Aliases: `MOSQUITO`,`INSECT`,`DISEASE`,`MALARIA`
       */
      "FEVER" = "🦟",
      /**
       * Emoji: 🦠
       *
       * Aliases: `AMOEBA`,`BACTERIA`,`VIRUS`
       */
      "MICROBE" = "🦠",
      /**
       * Emoji: 🦠
       *
       * Aliases: `MICROBE`,`BACTERIA`,`VIRUS`
       */
      "AMOEBA" = "🦠",
      /**
       * Emoji: 🦠
       *
       * Aliases: `MICROBE`,`AMOEBA`,`VIRUS`
       */
      "BACTERIA" = "🦠",
      /**
       * Emoji: 🦠
       *
       * Aliases: `MICROBE`,`AMOEBA`,`BACTERIA`
       */
      "VIRUS" = "🦠",
      /**
       * Emoji: 🦓
       */
      "ZEBRA" = "🦓",
      /**
       * Emoji: 🦒
       */
      "GIRAFFE" = "🦒",
      /**
       * Emoji: 🦔
       *
       * Aliases: `ECHINDA`,`SPINY`
       */
      "HEDGEHOG" = "🦔",
      /**
       * Emoji: 🦔
       *
       * Aliases: `HEDGEHOG`,`SPINY`
       */
      "ECHINDA" = "🦔",
      /**
       * Emoji: 🦔
       *
       * Aliases: `HEDGEHOG`,`ECHINDA`
       */
      "SPINY" = "🦔",
      /**
       * Emoji: 🦕
       *
       * Aliases: `BRACHIOSAURUS`,`BRONTOSAURUS`,`DIPLODOCUS`,`DINOSAUR`
       */
      "SAUROPOD" = "🦕",
      /**
       * Emoji: 🦕
       *
       * Aliases: `SAUROPOD`,`BRONTOSAURUS`,`DIPLODOCUS`,`DINOSAUR`
       */
      "BRACHIOSAURUS" = "🦕",
      /**
       * Emoji: 🦕
       *
       * Aliases: `SAUROPOD`,`BRACHIOSAURUS`,`DIPLODOCUS`,`DINOSAUR`
       */
      "BRONTOSAURUS" = "🦕",
      /**
       * Emoji: 🦕
       *
       * Aliases: `SAUROPOD`,`BRACHIOSAURUS`,`BRONTOSAURUS`,`DINOSAUR`
       */
      "DIPLODOCUS" = "🦕",
      /**
       * Emoji: 🦕
       *
       * Aliases: `SAUROPOD`,`BRACHIOSAURUS`,`BRONTOSAURUS`,`DIPLODOCUS`
       */
      "DINOSAUR" = "🦕",
      /**
       * Emoji: 🦖
       *
       * Aliases: `TYRANNOSAURUS_REX`
       */
      "T_REX" = "🦖",
      /**
       * Emoji: 🦖
       *
       * Aliases: `T_REX`
       */
      "TYRANNOSAURUS_REX" = "🦖",
      /**
       * Emoji: 🏏
       *
       * Aliases: `CRICKET_BAT_BALL`
       */
      "CRICKET" = "🏏",
      /**
       * Emoji: 🦗
       *
       * Aliases: `CRICKET`,`ORTHOPTERA`
       */
      "GRASSHOPPER" = "🦗",
      /**
       * Emoji: 🦗
       *
       * Aliases: `CRICKET`,`GRASSHOPPER`
       */
      "ORTHOPTERA" = "🦗",
      /**
       * Emoji: 🦧
       */
      "ORANGUTAN" = "🦧",
      /**
       * Emoji: 🦮
       */
      "GUIDE_DOG" = "🦮",
      /**
       * Emoji: 🐕‍🦺
       */
      "SERVICE_DOG" = "🐕‍🦺",
      /**
       * Emoji: 🦥
       */
      "SLOTH" = "🦥",
      /**
       * Emoji: 🦦
       */
      "OTTER" = "🦦",
      /**
       * Emoji: 🦨
       */
      "SKUNK" = "🦨",
      /**
       * Emoji: 🦩
       */
      "FLAMINGO" = "🦩",
      /**
       * Emoji: 🦪
       */
      "OYSTER" = "🦪",
      /**
       * Emoji: 🪐
       */
      "RINGED_PLANET" = "🪐",
      /**
       * Emoji: 🍏
       */
      "GREEN_APPLE" = "🍏",
      /**
       * Emoji: 🍎
       */
      "APPLE" = "🍎",
      /**
       * Emoji: 🍐
       */
      "PEAR" = "🍐",
      /**
       * Emoji: 🍊
       */
      "TANGERINE" = "🍊",
      /**
       * Emoji: 🍋
       */
      "LEMON" = "🍋",
      /**
       * Emoji: 🍌
       */
      "BANANA" = "🍌",
      /**
       * Emoji: 🍉
       */
      "WATERMELON" = "🍉",
      /**
       * Emoji: 🍇
       */
      "GRAPES" = "🍇",
      /**
       * Emoji: 🍓
       */
      "STRAWBERRY" = "🍓",
      /**
       * Emoji: 🍈
       */
      "MELON" = "🍈",
      /**
       * Emoji: 🍒
       */
      "CHERRIES" = "🍒",
      /**
       * Emoji: 🍑
       */
      "PEACH" = "🍑",
      /**
       * Emoji: 🍍
       */
      "PINEAPPLE" = "🍍",
      /**
       * Emoji: 🍅
       */
      "TOMATO" = "🍅",
      /**
       * Emoji: 🍆
       */
      "EGGPLANT" = "🍆",
      /**
       * Emoji: 🌶
       */
      "HOT_PEPPER" = "🌶",
      /**
       * Emoji: 🌽
       */
      "CORN" = "🌽",
      /**
       * Emoji: 🍠
       */
      "SWEET_POTATO" = "🍠",
      /**
       * Emoji: 🍯
       */
      "HONEY_POT" = "🍯",
      /**
       * Emoji: 🍞
       */
      "BREAD" = "🍞",
      /**
       * Emoji: 🧀
       *
       * Aliases: `CHEESE_WEDGE`
       */
      "CHEESE" = "🧀",
      /**
       * Emoji: 🧀
       *
       * Aliases: `CHEESE`
       */
      "CHEESE_WEDGE" = "🧀",
      /**
       * Emoji: 🍗
       */
      "POULTRY_LEG" = "🍗",
      /**
       * Emoji: 🍖
       */
      "MEAT_ON_BONE" = "🍖",
      /**
       * Emoji: 🍤
       */
      "FRIED_SHRIMP" = "🍤",
      /**
       * Emoji: 🍳
       */
      "COOKING" = "🍳",
      /**
       * Emoji: 🍔
       */
      "HAMBURGER" = "🍔",
      /**
       * Emoji: 🍟
       */
      "FRIES" = "🍟",
      /**
       * Emoji: 🌭
       *
       * Aliases: `HOT_DOG`
       */
      "HOTDOG" = "🌭",
      /**
       * Emoji: 🌭
       *
       * Aliases: `HOTDOG`
       */
      "HOT_DOG" = "🌭",
      /**
       * Emoji: 🍕
       */
      "PIZZA" = "🍕",
      /**
       * Emoji: 🍝
       */
      "SPAGHETTI" = "🍝",
      /**
       * Emoji: 🌮
       */
      "TACO" = "🌮",
      /**
       * Emoji: 🌯
       */
      "BURRITO" = "🌯",
      /**
       * Emoji: 🍜
       */
      "RAMEN" = "🍜",
      /**
       * Emoji: 🍲
       */
      "STEW" = "🍲",
      /**
       * Emoji: 🍥
       */
      "FISH_CAKE" = "🍥",
      /**
       * Emoji: 🍣
       */
      "SUSHI" = "🍣",
      /**
       * Emoji: 🍱
       */
      "BENTO" = "🍱",
      /**
       * Emoji: 🍛
       */
      "CURRY" = "🍛",
      /**
       * Emoji: 🍙
       */
      "RICE_BALL" = "🍙",
      /**
       * Emoji: 🍚
       */
      "RICE" = "🍚",
      /**
       * Emoji: 🍘
       */
      "RICE_CRACKER" = "🍘",
      /**
       * Emoji: 🍢
       */
      "ODEN" = "🍢",
      /**
       * Emoji: 🍡
       */
      "DANGO" = "🍡",
      /**
       * Emoji: 🍧
       */
      "SHAVED_ICE" = "🍧",
      /**
       * Emoji: 🍨
       */
      "ICE_CREAM" = "🍨",
      /**
       * Emoji: 🍦
       */
      "ICECREAM" = "🍦",
      /**
       * Emoji: 🍰
       */
      "CAKE" = "🍰",
      /**
       * Emoji: 🎂
       */
      "BIRTHDAY" = "🎂",
      /**
       * Emoji: 🍮
       *
       * Aliases: `PUDDING`,`FLAN`
       */
      "CUSTARD" = "🍮",
      /**
       * Emoji: 🍮
       *
       * Aliases: `CUSTARD`,`FLAN`
       */
      "PUDDING" = "🍮",
      /**
       * Emoji: 🍮
       *
       * Aliases: `CUSTARD`,`PUDDING`
       */
      "FLAN" = "🍮",
      /**
       * Emoji: 🍬
       */
      "CANDY" = "🍬",
      /**
       * Emoji: 🍭
       */
      "LOLLIPOP" = "🍭",
      /**
       * Emoji: 🍫
       */
      "CHOCOLATE_BAR" = "🍫",
      /**
       * Emoji: 🍿
       */
      "POPCORN" = "🍿",
      /**
       * Emoji: 🍩
       */
      "DOUGHNUT" = "🍩",
      /**
       * Emoji: 🍪
       */
      "COOKIE" = "🍪",
      /**
       * Emoji: 🍺
       */
      "BEER" = "🍺",
      /**
       * Emoji: 🍻
       */
      "BEERS" = "🍻",
      /**
       * Emoji: 🍷
       */
      "WINE_GLASS" = "🍷",
      /**
       * Emoji: 🍸
       */
      "COCKTAIL" = "🍸",
      /**
       * Emoji: 🍹
       */
      "TROPICAL_DRINK" = "🍹",
      /**
       * Emoji: 🍾
       *
       * Aliases: `BOTTLE_WITH_POPPING_CORK`
       */
      "CHAMPAGNE" = "🍾",
      /**
       * Emoji: 🍾
       *
       * Aliases: `CHAMPAGNE`
       */
      "BOTTLE_WITH_POPPING_CORK" = "🍾",
      /**
       * Emoji: 🍶
       */
      "SAKE" = "🍶",
      /**
       * Emoji: 🍵
       */
      "TEA" = "🍵",
      /**
       * Emoji: ☕
       */
      "COFFEE" = "☕",
      /**
       * Emoji: 🍼
       */
      "BABY_BOTTLE" = "🍼",
      /**
       * Emoji: 🍴
       */
      "FORK_AND_KNIFE" = "🍴",
      /**
       * Emoji: 🍽
       *
       * Aliases: `FORK_AND_KNIFE_WITH_PLATE`
       */
      "FORK_KNIFE_PLATE" = "🍽",
      /**
       * Emoji: 🍽
       *
       * Aliases: `FORK_KNIFE_PLATE`
       */
      "FORK_AND_KNIFE_WITH_PLATE" = "🍽",
      /**
       * Emoji: 🥐
       */
      "CROISSANT" = "🥐",
      /**
       * Emoji: 🥑
       */
      "AVOCADO" = "🥑",
      /**
       * Emoji: 🥒
       */
      "CUCUMBER" = "🥒",
      /**
       * Emoji: 🥓
       */
      "BACON" = "🥓",
      /**
       * Emoji: 🥔
       */
      "POTATO" = "🥔",
      /**
       * Emoji: 🥕
       */
      "CARROT" = "🥕",
      /**
       * Emoji: 🥖
       *
       * Aliases: `BAGUETTE_BREAD`
       */
      "FRENCH_BREAD" = "🥖",
      /**
       * Emoji: 🥖
       *
       * Aliases: `FRENCH_BREAD`
       */
      "BAGUETTE_BREAD" = "🥖",
      /**
       * Emoji: 🥗
       *
       * Aliases: `GREEN_SALAD`
       */
      "SALAD" = "🥗",
      /**
       * Emoji: 🥗
       *
       * Aliases: `SALAD`
       */
      "GREEN_SALAD" = "🥗",
      /**
       * Emoji: 🥘
       *
       * Aliases: `PAELLA`
       */
      "SHALLOW_PAN_OF_FOOD" = "🥘",
      /**
       * Emoji: 🥘
       *
       * Aliases: `SHALLOW_PAN_OF_FOOD`
       */
      "PAELLA" = "🥘",
      /**
       * Emoji: 🥙
       *
       * Aliases: `STUFFED_PITA`
       */
      "STUFFED_FLATBREAD" = "🥙",
      /**
       * Emoji: 🥙
       *
       * Aliases: `STUFFED_FLATBREAD`
       */
      "STUFFED_PITA" = "🥙",
      /**
       * Emoji: 🥂
       *
       * Aliases: `CLINKING_GLASS`
       */
      "CHAMPAGNE_GLASS" = "🥂",
      /**
       * Emoji: 🥂
       *
       * Aliases: `CHAMPAGNE_GLASS`
       */
      "CLINKING_GLASS" = "🥂",
      /**
       * Emoji: 🥃
       *
       * Aliases: `WHISKY`
       */
      "TUMBLER_GLASS" = "🥃",
      /**
       * Emoji: 🥃
       *
       * Aliases: `TUMBLER_GLASS`
       */
      "WHISKY" = "🥃",
      /**
       * Emoji: 🥄
       */
      "SPOON" = "🥄",
      /**
       * Emoji: 🥚
       */
      "EGG" = "🥚",
      /**
       * Emoji: 🥛
       *
       * Aliases: `GLASS_OF_MILK`
       */
      "MILK" = "🥛",
      /**
       * Emoji: 🥛
       *
       * Aliases: `MILK`
       */
      "GLASS_OF_MILK" = "🥛",
      /**
       * Emoji: 🥜
       *
       * Aliases: `SHELLED_PEANUT`
       */
      "PEANUTS" = "🥜",
      /**
       * Emoji: 🥜
       *
       * Aliases: `PEANUTS`
       */
      "SHELLED_PEANUT" = "🥜",
      /**
       * Emoji: 🥝
       *
       * Aliases: `KIWIFRUIT`
       */
      "KIWI" = "🥝",
      /**
       * Emoji: 🥝
       *
       * Aliases: `KIWI`
       */
      "KIWIFRUIT" = "🥝",
      /**
       * Emoji: 🥞
       */
      "PANCAKES" = "🥞",
      /**
       * Emoji: 🥭
       *
       * Aliases: `TROPICAL`
       */
      "MANGO" = "🥭",
      /**
       * Emoji: 🥭
       *
       * Aliases: `MANGO`
       */
      "TROPICAL" = "🥭",
      /**
       * Emoji: 🥬
       *
       * Aliases: `CABBAGE`,`KALE`,`LETTUCE`
       */
      "LEAFY_GREEN" = "🥬",
      /**
       * Emoji: 🥬
       *
       * Aliases: `LEAFY_GREEN`,`KALE`,`LETTUCE`
       */
      "CABBAGE" = "🥬",
      /**
       * Emoji: 🥬
       *
       * Aliases: `LEAFY_GREEN`,`CABBAGE`,`LETTUCE`
       */
      "KALE" = "🥬",
      /**
       * Emoji: 🥬
       *
       * Aliases: `LEAFY_GREEN`,`CABBAGE`,`KALE`
       */
      "LETTUCE" = "🥬",
      /**
       * Emoji: 🥯
       *
       * Aliases: `SCHMEAR`
       */
      "BAGEL" = "🥯",
      /**
       * Emoji: 🥯
       *
       * Aliases: `BAGEL`
       */
      "SCHMEAR" = "🥯",
      /**
       * Emoji: 🧂
       *
       * Aliases: `CONDEMENT`,`SHAKER`,`SALT_SHAKER`
       */
      "SALT" = "🧂",
      /**
       * Emoji: 🧂
       *
       * Aliases: `SALT`,`SHAKER`,`SALT_SHAKER`
       */
      "CONDEMENT" = "🧂",
      /**
       * Emoji: 🧂
       *
       * Aliases: `SALT`,`CONDEMENT`,`SALT_SHAKER`
       */
      "SHAKER" = "🧂",
      /**
       * Emoji: 🧂
       *
       * Aliases: `SALT`,`CONDEMENT`,`SHAKER`
       */
      "SALT_SHAKER" = "🧂",
      /**
       * Emoji: 🥮
       */
      "MOON_CAKE" = "🥮",
      /**
       * Emoji: 🧁
       *
       * Aliases: `BAKERY`,`SWEET`
       */
      "CUPCAKE" = "🧁",
      /**
       * Emoji: 🧁
       *
       * Aliases: `CUPCAKE`,`SWEET`
       */
      "BAKERY" = "🧁",
      /**
       * Emoji: 🧁
       *
       * Aliases: `CUPCAKE`,`BAKERY`
       */
      "SWEET" = "🧁",
      /**
       * Emoji: 🥥
       */
      "COCONUT" = "🥥",
      /**
       * Emoji: 🥦
       */
      "BROCCOLI" = "🥦",
      /**
       * Emoji: 🥨
       */
      "PRETZEL" = "🥨",
      /**
       * Emoji: 🥩
       *
       * Aliases: `STEAK`,`LAMBCHOP`,`PORKCHOP`
       */
      "CUT_OF_MEAT" = "🥩",
      /**
       * Emoji: 🥩
       *
       * Aliases: `CUT_OF_MEAT`,`LAMBCHOP`,`PORKCHOP`
       */
      "STEAK" = "🥩",
      /**
       * Emoji: 🥩
       *
       * Aliases: `CUT_OF_MEAT`,`STEAK`,`PORKCHOP`
       */
      "LAMBCHOP" = "🥩",
      /**
       * Emoji: 🥩
       *
       * Aliases: `CUT_OF_MEAT`,`STEAK`,`LAMBCHOP`
       */
      "PORKCHOP" = "🥩",
      /**
       * Emoji: 🥪
       */
      "SANDWICH" = "🥪",
      /**
       * Emoji: 🥣
       *
       * Aliases: `CEREAL_BOWL`,`OATMEAL`
       */
      "BOWL_WITH_SPOON" = "🥣",
      /**
       * Emoji: 🥣
       *
       * Aliases: `BOWL_WITH_SPOON`,`OATMEAL`
       */
      "CEREAL_BOWL" = "🥣",
      /**
       * Emoji: 🥣
       *
       * Aliases: `BOWL_WITH_SPOON`,`CEREAL_BOWL`
       */
      "OATMEAL" = "🥣",
      /**
       * Emoji: 🥫
       *
       * Aliases: `CAN`
       */
      "CANNED_FOOD" = "🥫",
      /**
       * Emoji: 🥫
       *
       * Aliases: `CANNED_FOOD`
       */
      "CAN" = "🥫",
      /**
       * Emoji: 🥟
       *
       * Aliases: `POTSTICKER`
       */
      "DUMPLING" = "🥟",
      /**
       * Emoji: 🥟
       *
       * Aliases: `DUMPLING`
       */
      "POTSTICKER" = "🥟",
      /**
       * Emoji: 🥠
       */
      "FORTUNE_COOKIE" = "🥠",
      /**
       * Emoji: 🥡
       */
      "TAKEOUT_BOX" = "🥡",
      /**
       * Emoji: 🥧
       */
      "PIE" = "🥧",
      /**
       * Emoji: 🥤
       *
       * Aliases: `TO_GO_CUP`
       */
      "CUP_WITH_STRAW" = "🥤",
      /**
       * Emoji: 🥤
       *
       * Aliases: `CUP_WITH_STRAW`
       */
      "TO_GO_CUP" = "🥤",
      /**
       * Emoji: 🥢
       */
      "CHOPSTICKS" = "🥢",
      /**
       * Emoji: 🧄
       */
      "GARLIC" = "🧄",
      /**
       * Emoji: 🧅
       */
      "ONION" = "🧅",
      /**
       * Emoji: 🧇
       */
      "WAFFLE" = "🧇",
      /**
       * Emoji: 🧆
       */
      "FALAFEL" = "🧆",
      /**
       * Emoji: 🧈
       */
      "BUTTER" = "🧈",
      /**
       * Emoji: 🧃
       *
       * Aliases: `JUICE_BOX`
       */
      "BEVERAGE_BOX" = "🧃",
      /**
       * Emoji: 🧃
       *
       * Aliases: `BEVERAGE_BOX`
       */
      "JUICE_BOX" = "🧃",
      /**
       * Emoji: 🧉
       */
      "MATE" = "🧉",
      /**
       * Emoji: 🧊
       */
      "ICE_CUBE" = "🧊",
      /**
       * Emoji: ⚽
       */
      "SOCCER" = "⚽",
      /**
       * Emoji: 🏀
       */
      "BASKETBALL" = "🏀",
      /**
       * Emoji: 🏈
       */
      "FOOTBALL" = "🏈",
      /**
       * Emoji: ⚾
       */
      "BASEBALL" = "⚾",
      /**
       * Emoji: 🎾
       */
      "TENNIS" = "🎾",
      /**
       * Emoji: 🏐
       */
      "VOLLEYBALL" = "🏐",
      /**
       * Emoji: 🏉
       */
      "RUGBY_FOOTBALL" = "🏉",
      /**
       * Emoji: 🎱
       */
      "8BALL" = "🎱",
      /**
       * Emoji: ⛳
       */
      "GOLF" = "⛳",
      /**
       * Emoji: 🏌
       */
      "GOLFER" = "🏌",
      /**
       * Emoji: 🏓
       *
       * Aliases: `TABLE_TENNIS`
       */
      "PING_PONG" = "🏓",
      /**
       * Emoji: 🏓
       *
       * Aliases: `PING_PONG`
       */
      "TABLE_TENNIS" = "🏓",
      /**
       * Emoji: 🏸
       */
      "BADMINTON" = "🏸",
      /**
       * Emoji: 🏒
       */
      "HOCKEY" = "🏒",
      /**
       * Emoji: 🏑
       */
      "FIELD_HOCKEY" = "🏑",
      /**
       * Emoji: 🏏
       *
       * Aliases: `CRICKET`
       */
      "CRICKET_BAT_BALL" = "🏏",
      /**
       * Emoji: 🎿
       */
      "SKI" = "🎿",
      /**
       * Emoji: ⛷
       */
      "SKIER" = "⛷",
      /**
       * Emoji: 🏂
       */
      "SNOWBOARDER" = "🏂",
      /**
       * Emoji: ⛸
       */
      "ICE_SKATE" = "⛸",
      /**
       * Emoji: 🏹
       *
       * Aliases: `ARCHERY`
       */
      "BOW_AND_ARROW" = "🏹",
      /**
       * Emoji: 🏹
       *
       * Aliases: `BOW_AND_ARROW`
       */
      "ARCHERY" = "🏹",
      /**
       * Emoji: 🎣
       */
      "FISHING_POLE_AND_FISH" = "🎣",
      /**
       * Emoji: 🚣
       */
      "ROWBOAT" = "🚣",
      /**
       * Emoji: 🏊
       */
      "SWIMMER" = "🏊",
      /**
       * Emoji: 🏄
       */
      "SURFER" = "🏄",
      /**
       * Emoji: 🛀
       */
      "BATH" = "🛀",
      /**
       * Emoji: ⛹
       *
       * Aliases: `PERSON_WITH_BALL`
       */
      "BASKETBALL_PLAYER" = "⛹",
      /**
       * Emoji: ⛹
       *
       * Aliases: `BASKETBALL_PLAYER`
       */
      "PERSON_WITH_BALL" = "⛹",
      /**
       * Emoji: 🏋
       *
       * Aliases: `WEIGHT_LIFTER`
       */
      "LIFTER" = "🏋",
      /**
       * Emoji: 🏋
       *
       * Aliases: `LIFTER`
       */
      "WEIGHT_LIFTER" = "🏋",
      /**
       * Emoji: 🚴
       */
      "BICYCLIST" = "🚴",
      /**
       * Emoji: 🚵
       */
      "MOUNTAIN_BICYCLIST" = "🚵",
      /**
       * Emoji: 🏇
       */
      "HORSE_RACING" = "🏇",
      /**
       * Emoji: 🕴
       *
       * Aliases: `MAN_IN_BUSINESS_SUIT_LEVITATING`
       */
      "LEVITATE" = "🕴",
      /**
       * Emoji: 🕴
       *
       * Aliases: `LEVITATE`
       */
      "MAN_IN_BUSINESS_SUIT_LEVITATING" = "🕴",
      /**
       * Emoji: 🏆
       */
      "TROPHY" = "🏆",
      /**
       * Emoji: 🎽
       */
      "RUNNING_SHIRT_WITH_SASH" = "🎽",
      /**
       * Emoji: 🏅
       *
       * Aliases: `SPORTS_MEDAL`
       */
      "MEDAL" = "🏅",
      /**
       * Emoji: 🏅
       *
       * Aliases: `MEDAL`
       */
      "SPORTS_MEDAL" = "🏅",
      /**
       * Emoji: 🎖
       */
      "MILITARY_MEDAL" = "🎖",
      /**
       * Emoji: 🎗
       */
      "REMINDER_RIBBON" = "🎗",
      /**
       * Emoji: 🏵
       */
      "ROSETTE" = "🏵",
      /**
       * Emoji: 🎫
       */
      "TICKET" = "🎫",
      /**
       * Emoji: 🎟
       *
       * Aliases: `ADMISSION_TICKETS`
       */
      "TICKETS" = "🎟",
      /**
       * Emoji: 🎟
       *
       * Aliases: `TICKETS`
       */
      "ADMISSION_TICKETS" = "🎟",
      /**
       * Emoji: 🎭
       */
      "PERFORMING_ARTS" = "🎭",
      /**
       * Emoji: 🎨
       */
      "ART" = "🎨",
      /**
       * Emoji: 🎪
       */
      "CIRCUS_TENT" = "🎪",
      /**
       * Emoji: 🎤
       */
      "MICROPHONE" = "🎤",
      /**
       * Emoji: 🎧
       */
      "HEADPHONES" = "🎧",
      /**
       * Emoji: 🎼
       */
      "MUSICAL_SCORE" = "🎼",
      /**
       * Emoji: 🎹
       */
      "MUSICAL_KEYBOARD" = "🎹",
      /**
       * Emoji: 🎷
       */
      "SAXOPHONE" = "🎷",
      /**
       * Emoji: 🎺
       */
      "TRUMPET" = "🎺",
      /**
       * Emoji: 🎸
       */
      "GUITAR" = "🎸",
      /**
       * Emoji: 🎻
       */
      "VIOLIN" = "🎻",
      /**
       * Emoji: 🎬
       */
      "CLAPPER" = "🎬",
      /**
       * Emoji: 🎮
       */
      "VIDEO_GAME" = "🎮",
      /**
       * Emoji: 👾
       */
      "SPACE_INVADER" = "👾",
      /**
       * Emoji: 🎯
       */
      "DART" = "🎯",
      /**
       * Emoji: 🎲
       */
      "GAME_DIE" = "🎲",
      /**
       * Emoji: 🎰
       */
      "SLOT_MACHINE" = "🎰",
      /**
       * Emoji: 🎳
       */
      "BOWLING" = "🎳",
      /**
       * Emoji: 🤸
       *
       * Aliases: `PERSON_DOING_CARTWHEEL`
       */
      "CARTWHEEL" = "🤸",
      /**
       * Emoji: 🤸
       *
       * Aliases: `CARTWHEEL`
       */
      "PERSON_DOING_CARTWHEEL" = "🤸",
      /**
       * Emoji: 🤹
       *
       * Aliases: `JUGGLER`
       */
      "JUGGLING" = "🤹",
      /**
       * Emoji: 🤹
       *
       * Aliases: `JUGGLING`
       */
      "JUGGLER" = "🤹",
      /**
       * Emoji: 🤼
       *
       * Aliases: `WRESTLING`
       */
      "WRESTLERS" = "🤼",
      /**
       * Emoji: 🤼
       *
       * Aliases: `WRESTLERS`
       */
      "WRESTLING" = "🤼",
      /**
       * Emoji: 🥊
       *
       * Aliases: `BOXING_GLOVES`
       */
      "BOXING_GLOVE" = "🥊",
      /**
       * Emoji: 🥊
       *
       * Aliases: `BOXING_GLOVE`
       */
      "BOXING_GLOVES" = "🥊",
      /**
       * Emoji: 🥋
       *
       * Aliases: `KARATE_UNIFORM`
       */
      "MARTIAL_ARTS_UNIFORM" = "🥋",
      /**
       * Emoji: 🥋
       *
       * Aliases: `MARTIAL_ARTS_UNIFORM`
       */
      "KARATE_UNIFORM" = "🥋",
      /**
       * Emoji: 🤽
       */
      "WATER_POLO" = "🤽",
      /**
       * Emoji: 🤾
       */
      "HANDBALL" = "🤾",
      /**
       * Emoji: 🥅
       *
       * Aliases: `GOAL_NET`
       */
      "GOAL" = "🥅",
      /**
       * Emoji: 🥅
       *
       * Aliases: `GOAL`
       */
      "GOAL_NET" = "🥅",
      /**
       * Emoji: 🤺
       *
       * Aliases: `FENCING`
       */
      "FENCER" = "🤺",
      /**
       * Emoji: 🤺
       *
       * Aliases: `FENCER`
       */
      "FENCING" = "🤺",
      /**
       * Emoji: 🥇
       *
       * Aliases: `FIRST_PLACE_MEDAL`
       */
      "FIRST_PLACE" = "🥇",
      /**
       * Emoji: 🥇
       *
       * Aliases: `FIRST_PLACE`
       */
      "FIRST_PLACE_MEDAL" = "🥇",
      /**
       * Emoji: 🥈
       *
       * Aliases: `SECOND_PLACE_MEDAL`
       */
      "SECOND_PLACE" = "🥈",
      /**
       * Emoji: 🥈
       *
       * Aliases: `SECOND_PLACE`
       */
      "SECOND_PLACE_MEDAL" = "🥈",
      /**
       * Emoji: 🥉
       *
       * Aliases: `THIRD_PLACE_MEDAL`
       */
      "THIRD_PLACE" = "🥉",
      /**
       * Emoji: 🥉
       *
       * Aliases: `THIRD_PLACE`
       */
      "THIRD_PLACE_MEDAL" = "🥉",
      /**
       * Emoji: 🥁
       *
       * Aliases: `DRUM_WITH_DRUMSTICKS`
       */
      "DRUM" = "🥁",
      /**
       * Emoji: 🥁
       *
       * Aliases: `DRUM`
       */
      "DRUM_WITH_DRUMSTICKS" = "🥁",
      /**
       * Emoji: 🥌
       */
      "CURLING_STONE" = "🥌",
      /**
       * Emoji: 🛷
       *
       * Aliases: `SLEDGE`,`SLEIGH`,`LUGE`,`TOBOGGAN`
       */
      "SLED" = "🛷",
      /**
       * Emoji: 🛷
       *
       * Aliases: `SLED`,`SLEIGH`,`LUGE`,`TOBOGGAN`
       */
      "SLEDGE" = "🛷",
      /**
       * Emoji: 🛷
       *
       * Aliases: `SLED`,`SLEDGE`,`LUGE`,`TOBOGGAN`
       */
      "SLEIGH" = "🛷",
      /**
       * Emoji: 🛷
       *
       * Aliases: `SLED`,`SLEDGE`,`SLEIGH`,`TOBOGGAN`
       */
      "LUGE" = "🛷",
      /**
       * Emoji: 🛷
       *
       * Aliases: `SLED`,`SLEDGE`,`SLEIGH`,`LUGE`
       */
      "TOBOGGAN" = "🛷",
      /**
       * Emoji: 🥎
       */
      "SOFTBALL" = "🥎",
      /**
       * Emoji: 🥏
       *
       * Aliases: `FRISBEE`,`ULTIMATE`
       */
      "FLYING_DISC" = "🥏",
      /**
       * Emoji: 🥏
       *
       * Aliases: `FLYING_DISC`,`ULTIMATE`
       */
      "FRISBEE" = "🥏",
      /**
       * Emoji: 🥏
       *
       * Aliases: `FLYING_DISC`,`FRISBEE`
       */
      "ULTIMATE" = "🥏",
      /**
       * Emoji: 🥍
       */
      "LACROSSE" = "🥍",
      /**
       * Emoji: 🧩
       *
       * Aliases: `PUZZLE`
       */
      "JIGSAW" = "🧩",
      /**
       * Emoji: 🧩
       *
       * Aliases: `JIGSAW`
       */
      "PUZZLE" = "🧩",
      /**
       * Emoji: 🧸
       *
       * Aliases: `TOY`
       */
      "TEDDY_BEAR" = "🧸",
      /**
       * Emoji: 🧸
       *
       * Aliases: `TEDDY_BEAR`
       */
      "TOY" = "🧸",
      /**
       * Emoji: ♟️
       *
       * Aliases: `CHESS`
       */
      "CHESS_PAWN" = "♟️",
      /**
       * Emoji: ♟️
       *
       * Aliases: `CHESS_PAWN`
       */
      "CHESS" = "♟️",
      /**
       * Emoji: 💆‍♂️
       */
      "MAN_MASSAGE" = "💆‍♂️",
      /**
       * Emoji: 💆‍♀️
       */
      "WOMAN_MASSAGE" = "💆‍♀️",
      /**
       * Emoji: 💇‍♂️
       */
      "MAN_HAIRCUT" = "💇‍♂️",
      /**
       * Emoji: 💇‍♀️
       */
      "WOMAN_HAIRCUT" = "💇‍♀️",
      /**
       * Emoji: 🚶‍♂️
       *
       * Aliases: `MAN_PEDESTRIAN`
       */
      "MAN_WALKING" = "🚶‍♂️",
      /**
       * Emoji: 🚶‍♂️
       *
       * Aliases: `MAN_WALKING`
       */
      "MAN_PEDESTRIAN" = "🚶‍♂️",
      /**
       * Emoji: 🚶‍♀️
       *
       * Aliases: `WOMAN_PEDESTRIAN`
       */
      "WOMAN_WALKING" = "🚶‍♀️",
      /**
       * Emoji: 🚶‍♀️
       *
       * Aliases: `WOMAN_WALKING`
       */
      "WOMAN_PEDESTRIAN" = "🚶‍♀️",
      /**
       * Emoji: 🏃‍♂️
       *
       * Aliases: `MAN_RUNNER`
       */
      "MAN_RUNNING" = "🏃‍♂️",
      /**
       * Emoji: 🏃‍♂️
       *
       * Aliases: `MAN_RUNNING`
       */
      "MAN_RUNNER" = "🏃‍♂️",
      /**
       * Emoji: 🏃‍♀️
       *
       * Aliases: `WOMAN_RUNNER`
       */
      "WOMAN_RUNNING" = "🏃‍♀️",
      /**
       * Emoji: 🏃‍♀️
       *
       * Aliases: `WOMAN_RUNNING`
       */
      "WOMAN_RUNNER" = "🏃‍♀️",
      /**
       * Emoji: 👯‍♂️
       *
       * Aliases: `MEN_DANCING`
       */
      "MEN_WITH_BUNNY_EARS_PARTYING" = "👯‍♂️",
      /**
       * Emoji: 👯‍♂️
       *
       * Aliases: `MEN_WITH_BUNNY_EARS_PARTYING`
       */
      "MEN_DANCING" = "👯‍♂️",
      /**
       * Emoji: 👯‍♀️
       *
       * Aliases: `WOMEN_DANCING`
       */
      "WOMEN_WITH_BUNNY_EARS_PARTYING" = "👯‍♀️",
      /**
       * Emoji: 👯‍♀️
       *
       * Aliases: `WOMEN_WITH_BUNNY_EARS_PARTYING`
       */
      "WOMEN_DANCING" = "👯‍♀️",
      /**
       * Emoji: 🏌️‍♂️
       *
       * Aliases: `MAN_GOLFER`
       */
      "MAN_GOLFING" = "🏌️‍♂️",
      /**
       * Emoji: 🏌️‍♂️
       *
       * Aliases: `MAN_GOLFING`
       */
      "MAN_GOLFER" = "🏌️‍♂️",
      /**
       * Emoji: 🏌️‍♀️
       *
       * Aliases: `WOMAN_GOLFER`
       */
      "WOMAN_GOLFING" = "🏌️‍♀️",
      /**
       * Emoji: 🏌️‍♀️
       *
       * Aliases: `WOMAN_GOLFING`
       */
      "WOMAN_GOLFER" = "🏌️‍♀️",
      /**
       * Emoji: 🏄‍♂️
       *
       * Aliases: `MAN_SURFER`
       */
      "MAN_SURFING" = "🏄‍♂️",
      /**
       * Emoji: 🏄‍♂️
       *
       * Aliases: `MAN_SURFING`
       */
      "MAN_SURFER" = "🏄‍♂️",
      /**
       * Emoji: 🏄‍♀️
       *
       * Aliases: `WOMAN_SURFER`
       */
      "WOMAN_SURFING" = "🏄‍♀️",
      /**
       * Emoji: 🏄‍♀️
       *
       * Aliases: `WOMAN_SURFING`
       */
      "WOMAN_SURFER" = "🏄‍♀️",
      /**
       * Emoji: 🚣‍♂️
       *
       * Aliases: `MAN_ROWBOAT`
       */
      "MAN_ROWING_BOAT" = "🚣‍♂️",
      /**
       * Emoji: 🚣‍♂️
       *
       * Aliases: `MAN_ROWING_BOAT`
       */
      "MAN_ROWBOAT" = "🚣‍♂️",
      /**
       * Emoji: 🚣‍♀️
       *
       * Aliases: `WOMAN_ROWBOAT`
       */
      "WOMAN_ROWING_BOAT" = "🚣‍♀️",
      /**
       * Emoji: 🚣‍♀️
       *
       * Aliases: `WOMAN_ROWING_BOAT`
       */
      "WOMAN_ROWBOAT" = "🚣‍♀️",
      /**
       * Emoji: 🏊‍♂️
       *
       * Aliases: `MAN_SWIMMER`
       */
      "MAN_SWIMMING" = "🏊‍♂️",
      /**
       * Emoji: 🏊‍♂️
       *
       * Aliases: `MAN_SWIMMING`
       */
      "MAN_SWIMMER" = "🏊‍♂️",
      /**
       * Emoji: 🏊‍♀️
       *
       * Aliases: `WOMAN_SWIMMER`
       */
      "WOMAN_SWIMMING" = "🏊‍♀️",
      /**
       * Emoji: 🏊‍♀️
       *
       * Aliases: `WOMAN_SWIMMING`
       */
      "WOMAN_SWIMMER" = "🏊‍♀️",
      /**
       * Emoji: ⛹️‍♂️
       *
       * Aliases: `MAN_BASKETBALL_PLAYER`
       */
      "MAN_BOUNCING_BALL" = "⛹️‍♂️",
      /**
       * Emoji: ⛹️‍♂️
       *
       * Aliases: `MAN_BOUNCING_BALL`
       */
      "MAN_BASKETBALL_PLAYER" = "⛹️‍♂️",
      /**
       * Emoji: ⛹️‍♀️
       *
       * Aliases:
       */
      "WOMAN_BOUNCING_BALL" = "⛹️‍♀️",
      /**
       * Emoji: 🏋️‍♂️
       *
       * Aliases: `MAN_WEIGHT_LIFTER`
       */
      "MAN_LIFTING_WEIGHTS" = "🏋️‍♂️",
      /**
       * Emoji: 🏋️‍♂️
       *
       * Aliases: `MAN_LIFTING_WEIGHTS`
       */
      "MAN_WEIGHT_LIFTER" = "🏋️‍♂️",
      /**
       * Emoji: 🏋️‍♀️
       *
       * Aliases: `WOMAN_WEIGHT_LIFTER`
       */
      "WOMAN_LIFTING_WEIGHTS" = "🏋️‍♀️",
      /**
       * Emoji: 🏋️‍♀️
       *
       * Aliases: `WOMAN_LIFTING_WEIGHTS`
       */
      "WOMAN_WEIGHT_LIFTER" = "🏋️‍♀️",
      /**
       * Emoji: 🚴‍♂️
       *
       * Aliases: `MAN_BICYCLIST`
       */
      "MAN_BIKING" = "🚴‍♂️",
      /**
       * Emoji: 🚴‍♂️
       *
       * Aliases: `MAN_BIKING`
       */
      "MAN_BICYCLIST" = "🚴‍♂️",
      /**
       * Emoji: 🚴‍♀️
       *
       * Aliases: `WOMAN_BICYCLIST`
       */
      "WOMAN_BIKING" = "🚴‍♀️",
      /**
       * Emoji: 🚴‍♀️
       *
       * Aliases: `WOMAN_BIKING`
       */
      "WOMAN_BICYCLIST" = "🚴‍♀️",
      /**
       * Emoji: 🚵‍♂️
       *
       * Aliases: `MAN_MOUNTAIN_BICYCLIST`
       */
      "MAN_MOUNTAIN_BIKING" = "🚵‍♂️",
      /**
       * Emoji: 🚵‍♂️
       *
       * Aliases: `MAN_MOUNTAIN_BIKING`
       */
      "MAN_MOUNTAIN_BICYCLIST" = "🚵‍♂️",
      /**
       * Emoji: 🚵‍♀️
       *
       * Aliases: `WOMAN_MOUNTAIN_BICYCLIST`
       */
      "WOMAN_MOUNTAIN_BIKING" = "🚵‍♀️",
      /**
       * Emoji: 🚵‍♀️
       *
       * Aliases: `WOMAN_MOUNTAIN_BIKING`
       */
      "WOMAN_MOUNTAIN_BICYCLIST" = "🚵‍♀️",
      /**
       * Emoji: 🤸‍♂️
       *
       * Aliases: `MAN_DOING_CARTWHEEL`
       */
      "MAN_CARTWHEELING" = "🤸‍♂️",
      /**
       * Emoji: 🤸‍♂️
       *
       * Aliases: `MAN_CARTWHEELING`
       */
      "MAN_DOING_CARTWHEEL" = "🤸‍♂️",
      /**
       * Emoji: 🤸‍♀️
       *
       * Aliases: `WOMAN_DOING_CARTWHEEL`
       */
      "WOMAN_CARTWHEELING" = "🤸‍♀️",
      /**
       * Emoji: 🤸‍♀️
       *
       * Aliases: `WOMAN_CARTWHEELING`
       */
      "WOMAN_DOING_CARTWHEEL" = "🤸‍♀️",
      /**
       * Emoji: 🤼‍♂️
       *
       * Aliases: `MEN_WRESTLERS`
       */
      "MEN_WRESTLING" = "🤼‍♂️",
      /**
       * Emoji: 🤼‍♂️
       *
       * Aliases: `MEN_WRESTLING`
       */
      "MEN_WRESTLERS" = "🤼‍♂️",
      /**
       * Emoji: 🤼‍♀️
       *
       * Aliases: `WOMEN_WRESTLERS`
       */
      "WOMEN_WRESTLING" = "🤼‍♀️",
      /**
       * Emoji: 🤼‍♀️
       *
       * Aliases: `WOMEN_WRESTLING`
       */
      "WOMEN_WRESTLERS" = "🤼‍♀️",
      /**
       * Emoji: 🤽‍♂️
       */
      "MAN_PLAYING_WATER_POLO" = "🤽‍♂️",
      /**
       * Emoji: 🤽‍♀️
       */
      "WOMAN_PLAYING_WATER_POLO" = "🤽‍♀️",
      /**
       * Emoji: 🤾‍♂️
       */
      "MAN_PLAYING_HANDBALL" = "🤾‍♂️",
      /**
       * Emoji: 🤾‍♀️
       */
      "WOMAN_PLAYING_HANDBALL" = "🤾‍♀️",
      /**
       * Emoji: 🤹‍♂️
       *
       * Aliases: `MAN_JUGGLER`
       */
      "MAN_JUGGLING" = "🤹‍♂️",
      /**
       * Emoji: 🤹‍♂️
       *
       * Aliases: `MAN_JUGGLING`
       */
      "MAN_JUGGLER" = "🤹‍♂️",
      /**
       * Emoji: 🤹‍♀️
       *
       * Aliases: `WOMAN_JUGGLER`
       */
      "WOMAN_JUGGLING" = "🤹‍♀️",
      /**
       * Emoji: 🤹‍♀️
       *
       * Aliases: `WOMAN_JUGGLING`
       */
      "WOMAN_JUGGLER" = "🤹‍♀️",
      /**
       * Emoji: 🧗
       *
       * Aliases: `CLIMBING`,`ROCK_CLIMBING`
       */
      "PERSON_CLIMBING" = "🧗",
      /**
       * Emoji: 🧗
       *
       * Aliases: `PERSON_CLIMBING`,`ROCK_CLIMBING`
       */
      "CLIMBING" = "🧗",
      /**
       * Emoji: 🧗
       *
       * Aliases: `PERSON_CLIMBING`,`CLIMBING`
       */
      "ROCK_CLIMBING" = "🧗",
      /**
       * Emoji: 🧗‍♀️
       *
       * Aliases: `MAN_ROCK_CLIMBING`
       */
      "WOMAN_CLIMBING" = "🧗‍♀️",
      /**
       * Emoji: 🧗‍♂️
       *
       * Aliases: `MAN_CLIMBING`
       */
      "MAN_ROCK_CLIMBING" = "🧗‍♂️",
      /**
       * Emoji: 🧗‍♂️
       *
       * Aliases: `MAN_ROCK_CLIMBING`
       */
      "MAN_CLIMBING" = "🧗‍♂️",
      /**
       * Emoji: 🧘
       *
       * Aliases: `LOTUS_POSITION`,`MEDITATION`,`YOGA`
       */
      "PERSON_IN_LOTUS_POSITION" = "🧘",
      /**
       * Emoji: 🧘
       *
       * Aliases: `PERSON_IN_LOTUS_POSITION`,`MEDITATION`,`YOGA`
       */
      "LOTUS_POSITION" = "🧘",
      /**
       * Emoji: 🧘
       *
       * Aliases: `PERSON_IN_LOTUS_POSITION`,`LOTUS_POSITION`,`YOGA`
       */
      "MEDITATION" = "🧘",
      /**
       * Emoji: 🧘
       *
       * Aliases: `PERSON_IN_LOTUS_POSITION`,`LOTUS_POSITION`,`MEDITATION`
       */
      "YOGA" = "🧘",
      /**
       * Emoji: 🧘‍♂️
       *
       * Aliases: `MAN_LOTUS_POSITION`,`MAN_MEDITATION`,`MAN_YOGA`
       */
      "MAN_IN_LOTUS_POSITION" = "🧘‍♂️",
      /**
       * Emoji: 🧘‍♂️
       *
       * Aliases: `MAN_IN_LOTUS_POSITION`,`MAN_MEDITATION`,`MAN_YOGA`
       */
      "MAN_LOTUS_POSITION" = "🧘‍♂️",
      /**
       * Emoji: 🧘‍♂️
       *
       * Aliases: `MAN_IN_LOTUS_POSITION`,`MAN_LOTUS_POSITION`,`MAN_YOGA`
       */
      "MAN_MEDITATION" = "🧘‍♂️",
      /**
       * Emoji: 🧘‍♂️
       *
       * Aliases: `MAN_IN_LOTUS_POSITION`,`MAN_LOTUS_POSITION`,`MAN_MEDITATION`
       */
      "MAN_YOGA" = "🧘‍♂️",
      /**
       * Emoji: 🧘‍♀️
       *
       * Aliases: `WOMAN_LOTUS_POSITION`,`WOMAN_MEDITATION`,`WOMAN_YOGA`
       */
      "WOMAN_IN_LOTUS_POSITION" = "🧘‍♀️",
      /**
       * Emoji: 🧘‍♀️
       *
       * Aliases: `WOMAN_IN_LOTUS_POSITION`,`WOMAN_MEDITATION`,`WOMAN_YOGA`
       */
      "WOMAN_LOTUS_POSITION" = "🧘‍♀️",
      /**
       * Emoji: 🧘‍♀️
       *
       * Aliases: `WOMAN_IN_LOTUS_POSITION`,`WOMAN_LOTUS_POSITION`,`WOMAN_YOGA`
       */
      "WOMAN_MEDITATION" = "🧘‍♀️",
      /**
       * Emoji: 🧘‍♀️
       *
       * Aliases: `WOMAN_IN_LOTUS_POSITION`,`WOMAN_LOTUS_POSITION`,`WOMAN_MEDITATION`
       */
      "WOMAN_YOGA" = "🧘‍♀️",
      /**
       * Emoji: 🛹
       */
      "SKATEBOARD" = "🛹",
      /**
       * Emoji: 🪂
       */
      "PARACHUTE" = "🪂",
      /**
       * Emoji: 🪀
       *
       * Aliases: `YOYO`
       */
      "YO_YO" = "🪀",
      /**
       * Emoji: 🪀
       *
       * Aliases: `YO_YO`
       */
      "YOYO" = "🪀",
      /**
       * Emoji: 🪁
       */
      "KITE" = "🪁",
      /**
       * Emoji: 🚗
       */
      "RED_CAR" = "🚗",
      /**
       * Emoji: 🚕
       */
      "TAXI" = "🚕",
      /**
       * Emoji: 🚙
       */
      "BLUE_CAR" = "🚙",
      /**
       * Emoji: 🚌
       */
      "BUS" = "🚌",
      /**
       * Emoji: 🚎
       */
      "TROLLEYBUS" = "🚎",
      /**
       * Emoji: 🏎
       *
       * Aliases: `RACING_CAR`
       */
      "RACE_CAR" = "🏎",
      /**
       * Emoji: 🏎
       *
       * Aliases: `RACE_CAR`
       */
      "RACING_CAR" = "🏎",
      /**
       * Emoji: 🚓
       */
      "POLICE_CAR" = "🚓",
      /**
       * Emoji: 🚑
       */
      "AMBULANCE" = "🚑",
      /**
       * Emoji: 🚒
       */
      "FIRE_ENGINE" = "🚒",
      /**
       * Emoji: 🚐
       */
      "MINIBUS" = "🚐",
      /**
       * Emoji: 🚚
       */
      "TRUCK" = "🚚",
      /**
       * Emoji: 🚛
       */
      "ARTICULATED_LORRY" = "🚛",
      /**
       * Emoji: 🚜
       */
      "TRACTOR" = "🚜",
      /**
       * Emoji: 🏍
       *
       * Aliases: `RACING_MOTORCYCLE`
       */
      "MOTORCYCLE" = "🏍",
      /**
       * Emoji: 🏍
       *
       * Aliases: `MOTORCYCLE`
       */
      "RACING_MOTORCYCLE" = "🏍",
      /**
       * Emoji: 🚲
       */
      "BIKE" = "🚲",
      /**
       * Emoji: 🚨
       */
      "ROTATING_LIGHT" = "🚨",
      /**
       * Emoji: 🚔
       */
      "ONCOMING_POLICE_CAR" = "🚔",
      /**
       * Emoji: 🚍
       */
      "ONCOMING_BUS" = "🚍",
      /**
       * Emoji: 🚘
       */
      "ONCOMING_AUTOMOBILE" = "🚘",
      /**
       * Emoji: 🚖
       */
      "ONCOMING_TAXI" = "🚖",
      /**
       * Emoji: 🚡
       */
      "AERIAL_TRAMWAY" = "🚡",
      /**
       * Emoji: 🚠
       */
      "MOUNTAIN_CABLEWAY" = "🚠",
      /**
       * Emoji: 🚟
       */
      "SUSPENSION_RAILWAY" = "🚟",
      /**
       * Emoji: 🚃
       */
      "RAILWAY_CAR" = "🚃",
      /**
       * Emoji: 🚋
       */
      "TRAIN" = "🚋",
      /**
       * Emoji: 🚝
       */
      "MONORAIL" = "🚝",
      /**
       * Emoji: 🚄
       */
      "BULLETTRAIN_SIDE" = "🚄",
      /**
       * Emoji: 🚅
       */
      "BULLETTRAIN_FRONT" = "🚅",
      /**
       * Emoji: 🚈
       */
      "LIGHT_RAIL" = "🚈",
      /**
       * Emoji: 🚞
       */
      "MOUNTAIN_RAILWAY" = "🚞",
      /**
       * Emoji: 🚂
       */
      "STEAM_LOCOMOTIVE" = "🚂",
      /**
       * Emoji: 🚆
       */
      "TRAIN2" = "🚆",
      /**
       * Emoji: 🚇
       */
      "METRO" = "🚇",
      /**
       * Emoji: 🚊
       */
      "TRAM" = "🚊",
      /**
       * Emoji: 🚉
       */
      "STATION" = "🚉",
      /**
       * Emoji: 🚁
       */
      "HELICOPTER" = "🚁",
      /**
       * Emoji: 🛩
       *
       * Aliases: `SMALL_AIRPLANE`
       */
      "AIRPLANE_SMALL" = "🛩",
      /**
       * Emoji: 🛩
       *
       * Aliases: `AIRPLANE_SMALL`
       */
      "SMALL_AIRPLANE" = "🛩",
      /**
       * Emoji: ✈
       */
      "AIRPLANE" = "✈",
      /**
       * Emoji: 🛫
       */
      "AIRPLANE_DEPARTURE" = "🛫",
      /**
       * Emoji: 🛬
       */
      "AIRPLANE_ARRIVING" = "🛬",
      /**
       * Emoji: ⛵
       */
      "SAILBOAT" = "⛵",
      /**
       * Emoji: 🛥
       */
      "MOTORBOAT" = "🛥",
      /**
       * Emoji: 🚤
       */
      "SPEEDBOAT" = "🚤",
      /**
       * Emoji: ⛴
       */
      "FERRY" = "⛴",
      /**
       * Emoji: 🛳
       *
       * Aliases: `PASSENGER_SHIP`
       */
      "CRUISE_SHIP" = "🛳",
      /**
       * Emoji: 🛳
       *
       * Aliases: `CRUISE_SHIP`
       */
      "PASSENGER_SHIP" = "🛳",
      /**
       * Emoji: 🚀
       */
      "ROCKET" = "🚀",
      /**
       * Emoji: 🛰
       */
      "SATELLITE_ORBITAL" = "🛰",
      /**
       * Emoji: 💺
       */
      "SEAT" = "💺",
      /**
       * Emoji: ⚓
       */
      "ANCHOR" = "⚓",
      /**
       * Emoji: 🚧
       */
      "CONSTRUCTION" = "🚧",
      /**
       * Emoji: ⛽
       */
      "FUELPUMP" = "⛽",
      /**
       * Emoji: 🚏
       */
      "BUSSTOP" = "🚏",
      /**
       * Emoji: 🚦
       */
      "VERTICAL_TRAFFIC_LIGHT" = "🚦",
      /**
       * Emoji: 🚥
       */
      "TRAFFIC_LIGHT" = "🚥",
      /**
       * Emoji: 🚢
       */
      "SHIP" = "🚢",
      /**
       * Emoji: 🎡
       */
      "FERRIS_WHEEL" = "🎡",
      /**
       * Emoji: 🎢
       */
      "ROLLER_COASTER" = "🎢",
      /**
       * Emoji: 🎠
       */
      "CAROUSEL_HORSE" = "🎠",
      /**
       * Emoji: 🏗
       *
       * Aliases: `BUILDING_CONSTRUCTION`
       */
      "CONSTRUCTION_SITE" = "🏗",
      /**
       * Emoji: 🏗
       *
       * Aliases: `CONSTRUCTION_SITE`
       */
      "BUILDING_CONSTRUCTION" = "🏗",
      /**
       * Emoji: 🌁
       */
      "FOGGY" = "🌁",
      /**
       * Emoji: 🗼
       */
      "TOKYO_TOWER" = "🗼",
      /**
       * Emoji: 🏭
       */
      "FACTORY" = "🏭",
      /**
       * Emoji: ⛲
       */
      "FOUNTAIN" = "⛲",
      /**
       * Emoji: 🎑
       */
      "RICE_SCENE" = "🎑",
      /**
       * Emoji: ⛰
       */
      "MOUNTAIN" = "⛰",
      /**
       * Emoji: 🏔
       *
       * Aliases: `SNOW_CAPPED_MOUNTAIN`
       */
      "MOUNTAIN_SNOW" = "🏔",
      /**
       * Emoji: 🏔
       *
       * Aliases: `MOUNTAIN_SNOW`
       */
      "SNOW_CAPPED_MOUNTAIN" = "🏔",
      /**
       * Emoji: 🗻
       */
      "MOUNT_FUJI" = "🗻",
      /**
       * Emoji: 🌋
       */
      "VOLCANO" = "🌋",
      /**
       * Emoji: 🗾
       */
      "JAPAN" = "🗾",
      /**
       * Emoji: 🏕
       */
      "CAMPING" = "🏕",
      /**
       * Emoji: ⛺
       */
      "TENT" = "⛺",
      /**
       * Emoji: 🏞
       *
       * Aliases: `NATIONAL_PARK`
       */
      "PARK" = "🏞",
      /**
       * Emoji: 🏞
       *
       * Aliases: `PARK`
       */
      "NATIONAL_PARK" = "🏞",
      /**
       * Emoji: 🛣
       */
      "MOTORWAY" = "🛣",
      /**
       * Emoji: 🛤
       *
       * Aliases: `RAILROAD_TRACK`
       */
      "RAILWAY_TRACK" = "🛤",
      /**
       * Emoji: 🛤
       *
       * Aliases: `RAILWAY_TRACK`
       */
      "RAILROAD_TRACK" = "🛤",
      /**
       * Emoji: 🌅
       */
      "SUNRISE" = "🌅",
      /**
       * Emoji: 🌄
       */
      "SUNRISE_OVER_MOUNTAINS" = "🌄",
      /**
       * Emoji: 🏜
       */
      "DESERT" = "🏜",
      /**
       * Emoji: 🏖
       *
       * Aliases: `BEACH_WITH_UMBRELLA`
       */
      "BEACH" = "🏖",
      /**
       * Emoji: 🏖
       *
       * Aliases: `BEACH`
       */
      "BEACH_WITH_UMBRELLA" = "🏖",
      /**
       * Emoji: 🏝
       *
       * Aliases: `DESERT_ISLAND`
       */
      "ISLAND" = "🏝",
      /**
       * Emoji: 🏝
       *
       * Aliases: `ISLAND`
       */
      "DESERT_ISLAND" = "🏝",
      /**
       * Emoji: 🌇
       *
       * Aliases: `CITY_SUNRISE`
       */
      "CITY_SUNSET" = "🌇",
      /**
       * Emoji: 🌇
       *
       * Aliases: `CITY_SUNSET`
       */
      "CITY_SUNRISE" = "🌇",
      /**
       * Emoji: 🌆
       */
      "CITY_DUSK" = "🌆",
      /**
       * Emoji: 🏙
       */
      "CITYSCAPE" = "🏙",
      /**
       * Emoji: 🌃
       */
      "NIGHT_WITH_STARS" = "🌃",
      /**
       * Emoji: 🌉
       */
      "BRIDGE_AT_NIGHT" = "🌉",
      /**
       * Emoji: 🌌
       */
      "MILKY_WAY" = "🌌",
      /**
       * Emoji: 🌠
       */
      "STARS" = "🌠",
      /**
       * Emoji: 🎇
       */
      "SPARKLER" = "🎇",
      /**
       * Emoji: 🧨
       *
       * Aliases: `FIRECRACKER`,`DYNAMITE`,`EXPLOSIVE`
       */
      "FIREWORKS" = "🧨",
      /**
       * Emoji: 🌈
       */
      "RAINBOW" = "🌈",
      /**
       * Emoji: 🏘
       *
       * Aliases: `HOUSE_BUILDINGS`
       */
      "HOMES" = "🏘",
      /**
       * Emoji: 🏘
       *
       * Aliases: `HOMES`
       */
      "HOUSE_BUILDINGS" = "🏘",
      /**
       * Emoji: 🏰
       */
      "EUROPEAN_CASTLE" = "🏰",
      /**
       * Emoji: 🏯
       */
      "JAPANESE_CASTLE" = "🏯",
      /**
       * Emoji: 🏟
       */
      "STADIUM" = "🏟",
      /**
       * Emoji: 🗽
       */
      "STATUE_OF_LIBERTY" = "🗽",
      /**
       * Emoji: 🏠
       */
      "HOUSE" = "🏠",
      /**
       * Emoji: 🏡
       */
      "HOUSE_WITH_GARDEN" = "🏡",
      /**
       * Emoji: 🏚
       *
       * Aliases: `DERELICT_HOUSE_BUILDING`
       */
      "HOUSE_ABANDONED" = "🏚",
      /**
       * Emoji: 🏚
       *
       * Aliases: `HOUSE_ABANDONED`
       */
      "DERELICT_HOUSE_BUILDING" = "🏚",
      /**
       * Emoji: 🏢
       */
      "OFFICE" = "🏢",
      /**
       * Emoji: 🏬
       */
      "DEPARTMENT_STORE" = "🏬",
      /**
       * Emoji: 🏣
       */
      "POST_OFFICE" = "🏣",
      /**
       * Emoji: 🏤
       */
      "EUROPEAN_POST_OFFICE" = "🏤",
      /**
       * Emoji: 🏥
       */
      "HOSPITAL" = "🏥",
      /**
       * Emoji: 🏦
       */
      "BANK" = "🏦",
      /**
       * Emoji: 🏨
       */
      "HOTEL" = "🏨",
      /**
       * Emoji: 🏪
       */
      "CONVENIENCE_STORE" = "🏪",
      /**
       * Emoji: 🏫
       */
      "SCHOOL" = "🏫",
      /**
       * Emoji: 🏩
       */
      "LOVE_HOTEL" = "🏩",
      /**
       * Emoji: 💒
       */
      "WEDDING" = "💒",
      /**
       * Emoji: 🏛
       */
      "CLASSICAL_BUILDING" = "🏛",
      /**
       * Emoji: ⛪
       */
      "CHURCH" = "⛪",
      /**
       * Emoji: 🕌
       */
      "MOSQUE" = "🕌",
      /**
       * Emoji: 🕍
       */
      "SYNAGOGUE" = "🕍",
      /**
       * Emoji: 🕋
       */
      "KAABA" = "🕋",
      /**
       * Emoji: ⛩
       */
      "SHINTO_SHRINE" = "⛩",
      /**
       * Emoji: 🛴
       */
      "SCOOTER" = "🛴",
      /**
       * Emoji: 🛵
       *
       * Aliases: `MOTORBIKE`
       */
      "MOTOR_SCOOTER" = "🛵",
      /**
       * Emoji: 🛵
       *
       * Aliases: `MOTOR_SCOOTER`
       */
      "MOTORBIKE" = "🛵",
      /**
       * Emoji: 🛶
       *
       * Aliases: `KAYAK`
       */
      "CANOE" = "🛶",
      /**
       * Emoji: 🛶
       *
       * Aliases: `CANOE`
       */
      "KAYAK" = "🛶",
      /**
       * Emoji: 🛸
       *
       * Aliases: `UFO`
       */
      "FLYING_SAUCER" = "🛸",
      /**
       * Emoji: 🛸
       *
       * Aliases: `FLYING_SAUCER`
       */
      "UFO" = "🛸",
      /**
       * Emoji: 🧳
       *
       * Aliases: `PACKING`,`TRAVEL`
       */
      "LUGGAGE" = "🧳",
      /**
       * Emoji: 🧳
       *
       * Aliases: `LUGGAGE`,`TRAVEL`
       */
      "PACKING" = "🧳",
      /**
       * Emoji: 🧳
       *
       * Aliases: `LUGGAGE`,`PACKING`
       */
      "TRAVEL" = "🧳",
      /**
       * Emoji: 🛕
       */
      "HINDU_TEMPLE" = "🛕",
      /**
       * Emoji: 🦽
       */
      "MANUAL_WHEELCHAIR" = "🦽",
      /**
       * Emoji: 🦼
       */
      "MOTORIZED_WHEELCHAIR" = "🦼",
      /**
       * Emoji: 🛺
       */
      "AUTO_RICKSHAW" = "🛺",
      /**
       * Emoji: ⌚
       */
      "WATCH" = "⌚",
      /**
       * Emoji: 📱
       */
      "IPHONE" = "📱",
      /**
       * Emoji: 📲
       */
      "CALLING" = "📲",
      /**
       * Emoji: 💻
       */
      "COMPUTER" = "💻",
      /**
       * Emoji: ⌨
       */
      "KEYBOARD" = "⌨",
      /**
       * Emoji: 🖥
       *
       * Aliases: `DESKTOP_COMPUTER`
       */
      "DESKTOP" = "🖥",
      /**
       * Emoji: 🖥
       *
       * Aliases: `DESKTOP`
       */
      "DESKTOP_COMPUTER" = "🖥",
      /**
       * Emoji: 🖨
       */
      "PRINTER" = "🖨",
      /**
       * Emoji: 🖱
       *
       * Aliases: `THREE_BUTTON_MOUSE`
       */
      "MOUSE_THREE_BUTTON" = "🖱",
      /**
       * Emoji: 🖱
       *
       * Aliases: `MOUSE_THREE_BUTTON`
       */
      "THREE_BUTTON_MOUSE" = "🖱",
      /**
       * Emoji: 🖲
       */
      "TRACKBALL" = "🖲",
      /**
       * Emoji: 🕹
       */
      "JOYSTICK" = "🕹",
      /**
       * Emoji: 🗜
       */
      "COMPRESSION" = "🗜",
      /**
       * Emoji: 💽
       */
      "MINIDISC" = "💽",
      /**
       * Emoji: 💾
       */
      "FLOPPY_DISK" = "💾",
      /**
       * Emoji: 💿
       */
      "CD" = "💿",
      /**
       * Emoji: 📀
       */
      "DVD" = "📀",
      /**
       * Emoji: 📼
       */
      "VHS" = "📼",
      /**
       * Emoji: 📷
       */
      "CAMERA" = "📷",
      /**
       * Emoji: 📸
       */
      "CAMERA_WITH_FLASH" = "📸",
      /**
       * Emoji: 📹
       */
      "VIDEO_CAMERA" = "📹",
      /**
       * Emoji: 🎥
       */
      "MOVIE_CAMERA" = "🎥",
      /**
       * Emoji: 📽
       *
       * Aliases: `FILM_PROJECTOR`
       */
      "PROJECTOR" = "📽",
      /**
       * Emoji: 📽
       *
       * Aliases: `PROJECTOR`
       */
      "FILM_PROJECTOR" = "📽",
      /**
       * Emoji: 🎞
       */
      "FILM_FRAMES" = "🎞",
      /**
       * Emoji: 📞
       */
      "TELEPHONE_RECEIVER" = "📞",
      /**
       * Emoji: ☎
       */
      "TELEPHONE" = "☎",
      /**
       * Emoji: 📟
       */
      "PAGER" = "📟",
      /**
       * Emoji: 📠
       */
      "FAX" = "📠",
      /**
       * Emoji: 📺
       */
      "TV" = "📺",
      /**
       * Emoji: 📻
       */
      "RADIO" = "📻",
      /**
       * Emoji: 🎙
       *
       * Aliases: `STUDIO_MICROPHONE`
       */
      "MICROPHONE2" = "🎙",
      /**
       * Emoji: 🎙
       *
       * Aliases: `MICROPHONE2`
       */
      "STUDIO_MICROPHONE" = "🎙",
      /**
       * Emoji: 🎚
       */
      "LEVEL_SLIDER" = "🎚",
      /**
       * Emoji: 🎛
       */
      "CONTROL_KNOBS" = "🎛",
      /**
       * Emoji: ⏱
       */
      "STOPWATCH" = "⏱",
      /**
       * Emoji: ⏲
       *
       * Aliases: `TIMER_CLOCK`
       */
      "TIMER" = "⏲",
      /**
       * Emoji: ⏲
       *
       * Aliases: `TIMER`
       */
      "TIMER_CLOCK" = "⏲",
      /**
       * Emoji: ⏰
       */
      "ALARM_CLOCK" = "⏰",
      /**
       * Emoji: 🕰
       *
       * Aliases: `MANTLEPIECE_CLOCK`
       */
      "CLOCK" = "🕰",
      /**
       * Emoji: 🕰
       *
       * Aliases: `CLOCK`
       */
      "MANTLEPIECE_CLOCK" = "🕰",
      /**
       * Emoji: ⏳
       */
      "HOURGLASS_FLOWING_SAND" = "⏳",
      /**
       * Emoji: ⌛
       */
      "HOURGLASS" = "⌛",
      /**
       * Emoji: 📡
       */
      "SATELLITE" = "📡",
      /**
       * Emoji: 🔋
       */
      "BATTERY" = "🔋",
      /**
       * Emoji: 🔌
       */
      "ELECTRIC_PLUG" = "🔌",
      /**
       * Emoji: 💡
       */
      "BULB" = "💡",
      /**
       * Emoji: 🔦
       */
      "FLASHLIGHT" = "🔦",
      /**
       * Emoji: 🕯
       */
      "CANDLE" = "🕯",
      /**
       * Emoji: 🗑
       */
      "WASTEBASKET" = "🗑",
      /**
       * Emoji: 🛢
       *
       * Aliases: `OIL_DRUM`
       */
      "OIL" = "🛢",
      /**
       * Emoji: 🛢
       *
       * Aliases: `OIL`
       */
      "OIL_DRUM" = "🛢",
      /**
       * Emoji: 💸
       */
      "MONEY_WITH_WINGS" = "💸",
      /**
       * Emoji: 💵
       */
      "DOLLAR" = "💵",
      /**
       * Emoji: 💴
       */
      "YEN" = "💴",
      /**
       * Emoji: 💶
       */
      "EURO" = "💶",
      /**
       * Emoji: 💷
       */
      "POUND" = "💷",
      /**
       * Emoji: 💰
       */
      "MONEYBAG" = "💰",
      /**
       * Emoji: 💳
       */
      "CREDIT_CARD" = "💳",
      /**
       * Emoji: 💎
       */
      "GEM" = "💎",
      /**
       * Emoji: ⚖
       */
      "SCALES" = "⚖",
      /**
       * Emoji: 🔧
       */
      "WRENCH" = "🔧",
      /**
       * Emoji: 🔨
       */
      "HAMMER" = "🔨",
      /**
       * Emoji: ⚒
       *
       * Aliases: `HAMMER_AND_PICK`
       */
      "HAMMER_PICK" = "⚒",
      /**
       * Emoji: ⚒
       *
       * Aliases: `HAMMER_PICK`
       */
      "HAMMER_AND_PICK" = "⚒",
      /**
       * Emoji: 🛠
       *
       * Aliases: `HAMMER_AND_WRENCH`
       */
      "TOOLS" = "🛠",
      /**
       * Emoji: 🛠
       *
       * Aliases: `TOOLS`
       */
      "HAMMER_AND_WRENCH" = "🛠",
      /**
       * Emoji: ⛏
       */
      "PICK" = "⛏",
      /**
       * Emoji: 🔩
       */
      "NUT_AND_BOLT" = "🔩",
      /**
       * Emoji: ⚙
       */
      "GEAR" = "⚙",
      /**
       * Emoji: ⛓
       */
      "CHAINS" = "⛓",
      /**
       * Emoji: 🔫
       */
      "GUN" = "🔫",
      /**
       * Emoji: 💣
       */
      "BOMB" = "💣",
      /**
       * Emoji: 🔪
       */
      "KNIFE" = "🔪",
      /**
       * Emoji: 🗡
       *
       * Aliases: `DAGGER_KNIFE`
       */
      "DAGGER" = "🗡",
      /**
       * Emoji: 🗡
       *
       * Aliases: `DAGGER`
       */
      "DAGGER_KNIFE" = "🗡",
      /**
       * Emoji: ⚔
       */
      "CROSSED_SWORDS" = "⚔",
      /**
       * Emoji: 🛡
       */
      "SHIELD" = "🛡",
      /**
       * Emoji: 🚬
       */
      "SMOKING" = "🚬",
      /**
       * Emoji: ☠
       *
       * Aliases: `SKULL_AND_CROSSBONES`
       */
      "SKULL_CROSSBONES" = "☠",
      /**
       * Emoji: ☠
       *
       * Aliases: `SKULL_CROSSBONES`
       */
      "SKULL_AND_CROSSBONES" = "☠",
      /**
       * Emoji: ⚰
       */
      "COFFIN" = "⚰",
      /**
       * Emoji: ⚱
       *
       * Aliases: `FUNERAL_URN`
       */
      "URN" = "⚱",
      /**
       * Emoji: ⚱
       *
       * Aliases: `URN`
       */
      "FUNERAL_URN" = "⚱",
      /**
       * Emoji: 🏺
       */
      "AMPHORA" = "🏺",
      /**
       * Emoji: 🔮
       */
      "CRYSTAL_BALL" = "🔮",
      /**
       * Emoji: 📿
       */
      "PRAYER_BEADS" = "📿",
      /**
       * Emoji: 💈
       */
      "BARBER" = "💈",
      /**
       * Emoji: ⚗
       */
      "ALEMBIC" = "⚗",
      /**
       * Emoji: 🔭
       */
      "TELESCOPE" = "🔭",
      /**
       * Emoji: 🔬
       */
      "MICROSCOPE" = "🔬",
      /**
       * Emoji: 🕳
       */
      "HOLE" = "🕳",
      /**
       * Emoji: 💊
       */
      "PILL" = "💊",
      /**
       * Emoji: 💉
       */
      "SYRINGE" = "💉",
      /**
       * Emoji: 🌡
       */
      "THERMOMETER" = "🌡",
      /**
       * Emoji: 🏷
       */
      "LABEL" = "🏷",
      /**
       * Emoji: 🔖
       */
      "BOOKMARK" = "🔖",
      /**
       * Emoji: 🚽
       */
      "TOILET" = "🚽",
      /**
       * Emoji: 🚿
       */
      "SHOWER" = "🚿",
      /**
       * Emoji: 🛁
       */
      "BATHTUB" = "🛁",
      /**
       * Emoji: 🔑
       */
      "KEY" = "🔑",
      /**
       * Emoji: 🗝
       *
       * Aliases: `OLD_KEY`
       */
      "KEY2" = "🗝",
      /**
       * Emoji: 🗝
       *
       * Aliases: `KEY2`
       */
      "OLD_KEY" = "🗝",
      /**
       * Emoji: 🛋
       *
       * Aliases: `COUCH_AND_LAMP`
       */
      "COUCH" = "🛋",
      /**
       * Emoji: 🛋
       *
       * Aliases: `COUCH`
       */
      "COUCH_AND_LAMP" = "🛋",
      /**
       * Emoji: 🛌
       *
       * Aliases: `PERSON_SLEEPING`
       */
      "SLEEPING_ACCOMMODATION" = "🛌",
      /**
       * Emoji: 🛌
       *
       * Aliases: `SLEEPING_ACCOMMODATION`
       */
      "PERSON_SLEEPING" = "🛌",
      /**
       * Emoji: 🛏
       */
      "BED" = "🛏",
      /**
       * Emoji: 🚪
       */
      "DOOR" = "🚪",
      /**
       * Emoji: 🛎
       *
       * Aliases: `BELLHOP_BELL`
       */
      "BELLHOP" = "🛎",
      /**
       * Emoji: 🛎
       *
       * Aliases: `BELLHOP`
       */
      "BELLHOP_BELL" = "🛎",
      /**
       * Emoji: 🖼
       *
       * Aliases: `FRAME_WITH_PICTURE`
       */
      "FRAME_PHOTO" = "🖼",
      /**
       * Emoji: 🖼
       *
       * Aliases: `FRAME_PHOTO`
       */
      "FRAME_WITH_PICTURE" = "🖼",
      /**
       * Emoji: 🗺
       *
       * Aliases: `WORLD_MAP`
       */
      "MAP" = "🗺",
      /**
       * Emoji: 🗺
       *
       * Aliases: `MAP`
       */
      "WORLD_MAP" = "🗺",
      /**
       * Emoji: ⛱
       *
       * Aliases: `UMBRELLA_ON_GROUND`
       */
      "BEACH_UMBRELLA" = "⛱",
      /**
       * Emoji: ⛱
       *
       * Aliases: `BEACH_UMBRELLA`
       */
      "UMBRELLA_ON_GROUND" = "⛱",
      /**
       * Emoji: 🗿
       */
      "MOYAI" = "🗿",
      /**
       * Emoji: 🛍
       */
      "SHOPPING_BAGS" = "🛍",
      /**
       * Emoji: 🎈
       */
      "BALLOON" = "🎈",
      /**
       * Emoji: 🎏
       */
      "FLAGS" = "🎏",
      /**
       * Emoji: 🎀
       */
      "RIBBON" = "🎀",
      /**
       * Emoji: 🎁
       */
      "GIFT" = "🎁",
      /**
       * Emoji: 🎊
       */
      "CONFETTI_BALL" = "🎊",
      /**
       * Emoji: 🎉
       */
      "TADA" = "🎉",
      /**
       * Emoji: 🎎
       */
      "DOLLS" = "🎎",
      /**
       * Emoji: 🎐
       */
      "WIND_CHIME" = "🎐",
      /**
       * Emoji: 🎌
       */
      "CROSSED_FLAGS" = "🎌",
      /**
       * Emoji: 🏮
       */
      "IZAKAYA_LANTERN" = "🏮",
      /**
       * Emoji: ✉
       */
      "ENVELOPE" = "✉",
      /**
       * Emoji: 📩
       */
      "ENVELOPE_WITH_ARROW" = "📩",
      /**
       * Emoji: 📨
       */
      "INCOMING_ENVELOPE" = "📨",
      /**
       * Emoji: 📧
       *
       * Aliases: `EMAIL`
       */
      "E_MAIL" = "📧",
      /**
       * Emoji: 📧
       *
       * Aliases: `E_MAIL`
       */
      "EMAIL" = "📧",
      /**
       * Emoji: 💌
       */
      "LOVE_LETTER" = "💌",
      /**
       * Emoji: 📮
       */
      "POSTBOX" = "📮",
      /**
       * Emoji: 📪
       */
      "MAILBOX_CLOSED" = "📪",
      /**
       * Emoji: 📫
       */
      "MAILBOX" = "📫",
      /**
       * Emoji: 📬
       */
      "MAILBOX_WITH_MAIL" = "📬",
      /**
       * Emoji: 📭
       */
      "MAILBOX_WITH_NO_MAIL" = "📭",
      /**
       * Emoji: 📦
       */
      "PACKAGE" = "📦",
      /**
       * Emoji: 📯
       */
      "POSTAL_HORN" = "📯",
      /**
       * Emoji: 📥
       */
      "INBOX_TRAY" = "📥",
      /**
       * Emoji: 📤
       */
      "OUTBOX_TRAY" = "📤",
      /**
       * Emoji: 📜
       */
      "SCROLL" = "📜",
      /**
       * Emoji: 📃
       */
      "PAGE_WITH_CURL" = "📃",
      /**
       * Emoji: 📑
       */
      "BOOKMARK_TABS" = "📑",
      /**
       * Emoji: 📊
       */
      "BAR_CHART" = "📊",
      /**
       * Emoji: 📈
       */
      "CHART_WITH_UPWARDS_TREND" = "📈",
      /**
       * Emoji: 📉
       */
      "CHART_WITH_DOWNWARDS_TREND" = "📉",
      /**
       * Emoji: 📄
       */
      "PAGE_FACING_UP" = "📄",
      /**
       * Emoji: 📅
       */
      "DATE" = "📅",
      /**
       * Emoji: 📆
       */
      "CALENDAR" = "📆",
      /**
       * Emoji: 🗓
       *
       * Aliases: `SPIRAL_CALENDAR_PAD`
       */
      "CALENDAR_SPIRAL" = "🗓",
      /**
       * Emoji: 🗓
       *
       * Aliases: `CALENDAR_SPIRAL`
       */
      "SPIRAL_CALENDAR_PAD" = "🗓",
      /**
       * Emoji: 📇
       */
      "CARD_INDEX" = "📇",
      /**
       * Emoji: 🗃
       *
       * Aliases: `CARD_FILE_BOX`
       */
      "CARD_BOX" = "🗃",
      /**
       * Emoji: 🗃
       *
       * Aliases: `CARD_BOX`
       */
      "CARD_FILE_BOX" = "🗃",
      /**
       * Emoji: 🗳
       *
       * Aliases: `BALLOT_BOX_WITH_BALLOT`
       */
      "BALLOT_BOX" = "🗳",
      /**
       * Emoji: 🗳
       *
       * Aliases: `BALLOT_BOX`
       */
      "BALLOT_BOX_WITH_BALLOT" = "🗳",
      /**
       * Emoji: 🗄
       */
      "FILE_CABINET" = "🗄",
      /**
       * Emoji: 📋
       */
      "CLIPBOARD" = "📋",
      /**
       * Emoji: 🗒
       *
       * Aliases: `SPIRAL_NOTE_PAD`
       */
      "NOTEPAD_SPIRAL" = "🗒",
      /**
       * Emoji: 🗒
       *
       * Aliases: `NOTEPAD_SPIRAL`
       */
      "SPIRAL_NOTE_PAD" = "🗒",
      /**
       * Emoji: 📁
       */
      "FILE_FOLDER" = "📁",
      /**
       * Emoji: 📂
       */
      "OPEN_FILE_FOLDER" = "📂",
      /**
       * Emoji: 🗂
       *
       * Aliases: `CARD_INDEX_DIVIDERS`
       */
      "DIVIDERS" = "🗂",
      /**
       * Emoji: 🗂
       *
       * Aliases: `DIVIDERS`
       */
      "CARD_INDEX_DIVIDERS" = "🗂",
      /**
       * Emoji: 🗞
       *
       * Aliases: `ROLLED_UP_NEWSPAPER`
       */
      "NEWSPAPER2" = "🗞",
      /**
       * Emoji: 🗞
       *
       * Aliases: `NEWSPAPER2`
       */
      "ROLLED_UP_NEWSPAPER" = "🗞",
      /**
       * Emoji: 📰
       */
      "NEWSPAPER" = "📰",
      /**
       * Emoji: 📓
       */
      "NOTEBOOK" = "📓",
      /**
       * Emoji: 📕
       */
      "CLOSED_BOOK" = "📕",
      /**
       * Emoji: 📗
       */
      "GREEN_BOOK" = "📗",
      /**
       * Emoji: 📘
       */
      "BLUE_BOOK" = "📘",
      /**
       * Emoji: 📙
       */
      "ORANGE_BOOK" = "📙",
      /**
       * Emoji: 📔
       */
      "NOTEBOOK_WITH_DECORATIVE_COVER" = "📔",
      /**
       * Emoji: 📒
       */
      "LEDGER" = "📒",
      /**
       * Emoji: 📚
       */
      "BOOKS" = "📚",
      /**
       * Emoji: 📖
       */
      "BOOK" = "📖",
      /**
       * Emoji: 🔗
       */
      "LINK" = "🔗",
      /**
       * Emoji: 📎
       */
      "PAPERCLIP" = "📎",
      /**
       * Emoji: 🖇
       *
       * Aliases: `LINKED_PAPERCLIPS`
       */
      "PAPERCLIPS" = "🖇",
      /**
       * Emoji: 🖇
       *
       * Aliases: `PAPERCLIPS`
       */
      "LINKED_PAPERCLIPS" = "🖇",
      /**
       * Emoji: ✂
       */
      "SCISSORS" = "✂",
      /**
       * Emoji: 📐
       */
      "TRIANGULAR_RULER" = "📐",
      /**
       * Emoji: 📏
       */
      "STRAIGHT_RULER" = "📏",
      /**
       * Emoji: 📌
       */
      "PUSHPIN" = "📌",
      /**
       * Emoji: 📍
       */
      "ROUND_PUSHPIN" = "📍",
      /**
       * Emoji: 🔐
       */
      "CLOSED_LOCK_WITH_KEY" = "🔐",
      /**
       * Emoji: 🔒
       */
      "LOCK" = "🔒",
      /**
       * Emoji: 🔓
       */
      "UNLOCK" = "🔓",
      /**
       * Emoji: 🔏
       */
      "LOCK_WITH_INK_PEN" = "🔏",
      /**
       * Emoji: 🖊
       *
       * Aliases: `LOWER_LEFT_BALLPOINT_PEN`
       */
      "PEN_BALLPOINT" = "🖊",
      /**
       * Emoji: 🖊
       *
       * Aliases: `PEN_BALLPOINT`
       */
      "LOWER_LEFT_BALLPOINT_PEN" = "🖊",
      /**
       * Emoji: 🖋
       *
       * Aliases: `LOWER_LEFT_FOUNTAIN_PEN`
       */
      "PEN_FOUNTAIN" = "🖋",
      /**
       * Emoji: 🖋
       *
       * Aliases: `PEN_FOUNTAIN`
       */
      "LOWER_LEFT_FOUNTAIN_PEN" = "🖋",
      /**
       * Emoji: ✒
       */
      "BLACK_NIB" = "✒",
      /**
       * Emoji: 📝
       */
      "PENCIL" = "📝",
      /**
       * Emoji: ✏
       */
      "PENCIL2" = "✏",
      /**
       * Emoji: 🖍
       *
       * Aliases: `LOWER_LEFT_CRAYON`
       */
      "CRAYON" = "🖍",
      /**
       * Emoji: 🖍
       *
       * Aliases: `CRAYON`
       */
      "LOWER_LEFT_CRAYON" = "🖍",
      /**
       * Emoji: 🖌
       *
       * Aliases: `LOWER_LEFT_PAINTBRUSH`
       */
      "PAINTBRUSH" = "🖌",
      /**
       * Emoji: 🖌
       *
       * Aliases: `PAINTBRUSH`
       */
      "LOWER_LEFT_PAINTBRUSH" = "🖌",
      /**
       * Emoji: 🔍
       */
      "MAG" = "🔍",
      /**
       * Emoji: 🔎
       */
      "MAG_RIGHT" = "🔎",
      /**
       * Emoji: 🛒
       *
       * Aliases: `SHOPPING_TROLLEY`
       */
      "SHOPPING_CART" = "🛒",
      /**
       * Emoji: 🛒
       *
       * Aliases: `SHOPPING_CART`
       */
      "SHOPPING_TROLLEY" = "🛒",
      /**
       * Emoji: 🧮
       *
       * Aliases: `CALCULATION`
       */
      "ABACUS" = "🧮",
      /**
       * Emoji: 🧮
       *
       * Aliases: `ABACUS`
       */
      "CALCULATION" = "🧮",
      /**
       * Emoji: 🧾
       */
      "RECEIPT" = "🧾",
      /**
       * Emoji: 🧰
       *
       * Aliases: `MECHANIC`
       */
      "TOOLBOX" = "🧰",
      /**
       * Emoji: 🧲
       *
       * Aliases: `HORSESHOE`
       */
      "MAGNET" = "🧲",
      /**
       * Emoji: 🧲
       *
       * Aliases: `MAGNET`
       */
      "HORSESHOE" = "🧲",
      /**
       * Emoji: 🧪
       *
       * Aliases: `CHEMISTRY`,`EXPERIMENT`,`SCIENCE`
       */
      "TEST_TUBE" = "🧪",
      /**
       * Emoji: 🧪
       *
       * Aliases: `TEST_TUBE`,`EXPERIMENT`,`SCIENCE`
       */
      "CHEMISTRY" = "🧪",
      /**
       * Emoji: 🧪
       *
       * Aliases: `TEST_TUBE`,`CHEMISTRY`,`SCIENCE`
       */
      "EXPERIMENT" = "🧪",
      /**
       * Emoji: 🧪
       *
       * Aliases: `TEST_TUBE`,`CHEMISTRY`,`EXPERIMENT`
       */
      "SCIENCE" = "🧪",
      /**
       * Emoji: 🧫
       *
       * Aliases: `BIOLOGIST`,`BIOLOGY`,`LAB`
       */
      "PETRI_DISH" = "🧫",
      /**
       * Emoji: 🧫
       *
       * Aliases: `PETRI_DISH`,`BIOLOGY`,`LAB`
       */
      "BIOLOGIST" = "🧫",
      /**
       * Emoji: 🧫
       *
       * Aliases: `PETRI_DISH`,`BIOLOGIST`,`LAB`
       */
      "BIOLOGY" = "🧫",
      /**
       * Emoji: 🧫
       *
       * Aliases: `PETRI_DISH`,`BIOLOGIST`,`BIOLOGY`
       */
      "LAB" = "🧫",
      /**
       * Emoji: 🧬
       *
       * Aliases: `EVOLUTION`,`GENE`,`GENETICS`
       */
      "DNA" = "🧬",
      /**
       * Emoji: 🧬
       *
       * Aliases: `DNA`,`GENE`,`GENETICS`
       */
      "EVOLUTION" = "🧬",
      /**
       * Emoji: 🧬
       *
       * Aliases: `DNA`,`EVOLUTION`,`GENETICS`
       */
      "GENE" = "🧬",
      /**
       * Emoji: 🧬
       *
       * Aliases: `DNA`,`EVOLUTION`,`GENE`
       */
      "GENETICS" = "🧬",
      /**
       * Emoji: 🧴
       *
       * Aliases: `LOTION`,`MOISTURIZER`,`SHAMPOO`,`SUNSCREEN`
       */
      "SQUEEZE_BOTTLE" = "🧴",
      /**
       * Emoji: 🧴
       *
       * Aliases: `SQUEEZE_BOTTLE`,`MOISTURIZER`,`SHAMPOO`,`SUNSCREEN`
       */
      "LOTION" = "🧴",
      /**
       * Emoji: 🧴
       *
       * Aliases: `SQUEEZE_BOTTLE`,`LOTION`,`SHAMPOO`,`SUNSCREEN`
       */
      "MOISTURIZER" = "🧴",
      /**
       * Emoji: 🧴
       *
       * Aliases: `SQUEEZE_BOTTLE`,`LOTION`,`MOISTURIZER`,`SUNSCREEN`
       */
      "SHAMPOO" = "🧴",
      /**
       * Emoji: 🧴
       *
       * Aliases: `SQUEEZE_BOTTLE`,`LOTION`,`MOISTURIZER`,`SHAMPOO`
       */
      "SUNSCREEN" = "🧴",
      /**
       * Emoji: 🧷
       */
      "SAFETY_PIN" = "🧷",
      /**
       * Emoji: 🧹
       *
       * Aliases: `CLEAN`,`SWEEP`
       */
      "BROOM" = "🧹",
      /**
       * Emoji: 🧹
       *
       * Aliases: `BROOM`,`SWEEP`
       */
      "CLEAN" = "🧹",
      /**
       * Emoji: 🧹
       *
       * Aliases: `BROOM`,`CLEAN`
       */
      "SWEEP" = "🧹",
      /**
       * Emoji: 🧺
       */
      "BASKET" = "🧺",
      /**
       * Emoji: 🧻
       *
       * Aliases: `TOILET_PAPER`,`BATHROOM_TISSUE`
       */
      "ROLL_OF_PAPER" = "🧻",
      /**
       * Emoji: 🧻
       *
       * Aliases: `ROLL_OF_PAPER`,`BATHROOM_TISSUE`
       */
      "TOILET_PAPER" = "🧻",
      /**
       * Emoji: 🧻
       *
       * Aliases: `ROLL_OF_PAPER`,`TOILET_PAPER`
       */
      "BATHROOM_TISSUE" = "🧻",
      /**
       * Emoji: 🧼
       */
      "SOAP" = "🧼",
      /**
       * Emoji: 🧽
       */
      "SPONGE" = "🧽",
      /**
       * Emoji: 🧯
       */
      "FIRE_EXTINGUISHER" = "🧯",
      /**
       * Emoji: 🧭
       *
       * Aliases: `NAVIGATION`,`ORIENTEERING`
       */
      "COMPASS" = "🧭",
      /**
       * Emoji: 🧭
       *
       * Aliases: `COMPASS`,`ORIENTEERING`
       */
      "NAVIGATION" = "🧭",
      /**
       * Emoji: 🧭
       *
       * Aliases: `COMPASS`,`NAVIGATION`
       */
      "ORIENTEERING" = "🧭",
      /**
       * Emoji: 🧨
       *
       * Aliases: `DYNAMITE`,`EXPLOSIVE`,`FIREWORKS`
       */
      "FIRECRACKER" = "🧨",
      /**
       * Emoji: 🧨
       *
       * Aliases: `FIRECRACKER`,`EXPLOSIVE`,`FIREWORKS`
       */
      "DYNAMITE" = "🧨",
      /**
       * Emoji: 🧨
       *
       * Aliases: `FIRECRACKER`,`DYNAMITE`,`FIREWORKS`
       */
      "EXPLOSIVE" = "🧨",
      /**
       * Emoji: 🧧
       *
       * Aliases: `RED_GIFT_ENVELOPE`,`LAI_SEE`,`RED_PACKET`
       */
      "RED_ENVELOPE" = "🧧",
      /**
       * Emoji: 🧧
       *
       * Aliases: `RED_ENVELOPE`,`LAI_SEE`,`RED_PACKET`
       */
      "RED_GIFT_ENVELOPE" = "🧧",
      /**
       * Emoji: 🧧
       *
       * Aliases: `RED_ENVELOPE`,`RED_GIFT_ENVELOPE`,`RED_PACKET`
       */
      "LAI_SEE" = "🧧",
      /**
       * Emoji: 🧧
       *
       * Aliases: `RED_ENVELOPE`,`RED_GIFT_ENVELOPE`,`LAI_SEE`
       */
      "RED_PACKET" = "🧧",
      /**
       * Emoji: 🧿
       */
      "NAZAR_AMULET" = "🧿",
      /**
       * Emoji: 🧱
       *
       * Aliases: `BRICK`
       */
      "BRICKS" = "🧱",
      /**
       * Emoji: 🧱
       *
       * Aliases: `BRICKS`
       */
      "BRICK" = "🧱",
      /**
       * Emoji: 🪔
       */
      "DIYA_LAMP" = "🪔",
      /**
       * Emoji: 🪓
       */
      "AXE" = "🪓",
      /**
       * Emoji: 🦯
       */
      "PROBING_CANE" = "🦯",
      /**
       * Emoji: 🩸
       */
      "DROP_OF_BLOOD" = "🩸",
      /**
       * Emoji: 🩹
       *
       * Aliases: `BAND_AID`
       */
      "ADHESIVE_BANDAGE" = "🩹",
      /**
       * Emoji: 🩹
       *
       * Aliases: `ADHESIVE_BANDAGE`
       */
      "BAND_AID" = "🩹",
      /**
       * Emoji: 🩺
       */
      "STETHOSCOPE" = "🩺",
      /**
       * Emoji: 🪑
       */
      "CHAIR" = "🪑",
      /**
       * Emoji: 🪒
       */
      "RAZOR" = "🪒",
      /**
       * Emoji: 💯
       */
      "_100" = "💯",
      /**
       * Emoji: 🔢
       */
      "_1234" = "🔢",
      /**
       * Emoji: ❤
       */
      "HEART" = "❤",
      /**
       * Emoji: 🧡
       */
      "ORANGE_HEART" = "🧡",
      /**
       * Emoji: 💛
       */
      "YELLOW_HEART" = "💛",
      /**
       * Emoji: 💚
       */
      "GREEN_HEART" = "💚",
      /**
       * Emoji: 💙
       */
      "BLUE_HEART" = "💙",
      /**
       * Emoji: 💜
       */
      "PURPLE_HEART" = "💜",
      /**
       * Emoji: 🖤
       */
      "BLACK_HEART" = "🖤",
      /**
       * Emoji: 🤎
       */
      "BROWN_HEART" = "🤎",
      /**
       * Emoji: 🤍
       */
      "WHITE_HEART" = "🤍",
      /**
       * Emoji: 💔
       */
      "BROKEN_HEART" = "💔",
      /**
       * Emoji: ❣
       *
       * Aliases: `HEAVY_HEART_EXCLAMATION_MARK_ORNAMENT`
       */
      "HEART_EXCLAMATION" = "❣",
      /**
       * Emoji: ❣
       *
       * Aliases: `HEART_EXCLAMATION`
       */
      "HEAVY_HEART_EXCLAMATION_MARK_ORNAMENT" = "❣",
      /**
       * Emoji: 💕
       */
      "TWO_HEARTS" = "💕",
      /**
       * Emoji: 💞
       */
      "REVOLVING_HEARTS" = "💞",
      /**
       * Emoji: 💓
       */
      "HEARTBEAT" = "💓",
      /**
       * Emoji: 💗
       */
      "HEARTPULSE" = "💗",
      /**
       * Emoji: 💖
       */
      "SPARKLING_HEART" = "💖",
      /**
       * Emoji: 💘
       */
      "CUPID" = "💘",
      /**
       * Emoji: 💝
       */
      "GIFT_HEART" = "💝",
      /**
       * Emoji: 💟
       */
      "HEART_DECORATION" = "💟",
      /**
       * Emoji: ☮
       *
       * Aliases: `PEACE_SYMBOL`
       */
      "PEACE" = "☮",
      /**
       * Emoji: ☮
       *
       * Aliases: `PEACE`
       */
      "PEACE_SYMBOL" = "☮",
      /**
       * Emoji: ✝
       *
       * Aliases: `LATIN_CROSS`
       */
      "CROSS" = "✝",
      /**
       * Emoji: ✝
       *
       * Aliases: `CROSS`
       */
      "LATIN_CROSS" = "✝",
      /**
       * Emoji: ☪
       */
      "STAR_AND_CRESCENT" = "☪",
      /**
       * Emoji: 🕉
       */
      "OM_SYMBOL" = "🕉",
      /**
       * Emoji: ☸
       */
      "WHEEL_OF_DHARMA" = "☸",
      /**
       * Emoji: ✡
       */
      "STAR_OF_DAVID" = "✡",
      /**
       * Emoji: 🔯
       */
      "SIX_POINTED_STAR" = "🔯",
      /**
       * Emoji: 🕎
       */
      "MENORAH" = "🕎",
      /**
       * Emoji: ☯
       */
      "YIN_YANG" = "☯",
      /**
       * Emoji: ☦
       */
      "ORTHODOX_CROSS" = "☦",
      /**
       * Emoji: 🛐
       *
       * Aliases: `WORSHIP_SYMBOL`
       */
      "PLACE_OF_WORSHIP" = "🛐",
      /**
       * Emoji: 🛐
       *
       * Aliases: `PLACE_OF_WORSHIP`
       */
      "WORSHIP_SYMBOL" = "🛐",
      /**
       * Emoji: ⛎
       */
      "OPHIUCHUS" = "⛎",
      /**
       * Emoji: ♈
       */
      "ARIES" = "♈",
      /**
       * Emoji: ♉
       */
      "TAURUS" = "♉",
      /**
       * Emoji: ♊
       */
      "GEMINI" = "♊",
      /**
       * Emoji: ♋
       */
      "CANCER" = "♋",
      /**
       * Emoji: ♌
       */
      "LEO" = "♌",
      /**
       * Emoji: ♍
       */
      "VIRGO" = "♍",
      /**
       * Emoji: ♎
       */
      "LIBRA" = "♎",
      /**
       * Emoji: ♏
       */
      "SCORPIUS" = "♏",
      /**
       * Emoji: ♐
       */
      "SAGITTARIUS" = "♐",
      /**
       * Emoji: ♑
       */
      "CAPRICORN" = "♑",
      /**
       * Emoji: ♒
       */
      "AQUARIUS" = "♒",
      /**
       * Emoji: ♓
       */
      "PISCES" = "♓",
      /**
       * Emoji: 🆔
       */
      "ID" = "🆔",
      /**
       * Emoji: ⚛
       *
       * Aliases: `ATOM_SYMBOL`
       */
      "ATOM" = "⚛",
      /**
       * Emoji: ⚛
       *
       * Aliases: `ATOM`
       */
      "ATOM_SYMBOL" = "⚛",
      /**
       * Emoji: 🈳
       */
      "U7A7A" = "🈳",
      /**
       * Emoji: 🈹
       */
      "U5272" = "🈹",
      /**
       * Emoji: ☢
       *
       * Aliases: `RADIOACTIVE_SIGN`
       */
      "RADIOACTIVE" = "☢",
      /**
       * Emoji: ☢
       *
       * Aliases: `RADIOACTIVE`
       */
      "RADIOACTIVE_SIGN" = "☢",
      /**
       * Emoji: ☣
       *
       * Aliases: `BIOHAZARD_SIGN`
       */
      "BIOHAZARD" = "☣",
      /**
       * Emoji: ☣
       *
       * Aliases: `BIOHAZARD`
       */
      "BIOHAZARD_SIGN" = "☣",
      /**
       * Emoji: 📴
       */
      "MOBILE_PHONE_OFF" = "📴",
      /**
       * Emoji: 📳
       */
      "VIBRATION_MODE" = "📳",
      /**
       * Emoji: 🈶
       */
      "U6709" = "🈶",
      /**
       * Emoji: 🈚
       */
      "U7121" = "🈚",
      /**
       * Emoji: 🈸
       */
      "U7533" = "🈸",
      /**
       * Emoji: 🈺
       */
      "U55B6" = "🈺",
      /**
       * Emoji: 🈷
       */
      "U6708" = "🈷",
      /**
       * Emoji: ✴
       */
      "EIGHT_POINTED_BLACK_STAR" = "✴",
      /**
       * Emoji: 🆚
       */
      "VS" = "🆚",
      /**
       * Emoji: 🉑
       */
      "ACCEPT" = "🉑",
      /**
       * Emoji: 💮
       */
      "WHITE_FLOWER" = "💮",
      /**
       * Emoji: 🉐
       */
      "IDEOGRAPH_ADVANTAGE" = "🉐",
      /**
       * Emoji: ㊙
       */
      "SECRET" = "㊙",
      /**
       * Emoji: ㊗
       */
      "CONGRATULATIONS" = "㊗",
      /**
       * Emoji: 🈴
       */
      "U5408" = "🈴",
      /**
       * Emoji: 🈵
       */
      "U6E80" = "🈵",
      /**
       * Emoji: 🈲
       */
      "U7981" = "🈲",
      /**
       * Emoji: 🅰
       */
      "A" = "🅰",
      /**
       * Emoji: 🅱
       */
      "B" = "🅱",
      /**
       * Emoji: 🆎
       */
      "AB" = "🆎",
      /**
       * Emoji: 🆑
       */
      "CL" = "🆑",
      /**
       * Emoji: 🅾
       */
      "O2" = "🅾",
      /**
       * Emoji: 🆘
       */
      "SOS" = "🆘",
      /**
       * Emoji: ⛔
       */
      "NO_ENTRY" = "⛔",
      /**
       * Emoji: 📛
       */
      "NAME_BADGE" = "📛",
      /**
       * Emoji: 🚫
       */
      "NO_ENTRY_SIGN" = "🚫",
      /**
       * Emoji: ❌
       */
      "X" = "❌",
      /**
       * Emoji: ⭕
       */
      "O" = "⭕",
      /**
       * Emoji: 💢
       */
      "ANGER" = "💢",
      /**
       * Emoji: ♨
       */
      "HOTSPRINGS" = "♨",
      /**
       * Emoji: 🚷
       */
      "NO_PEDESTRIANS" = "🚷",
      /**
       * Emoji: 🚯
       */
      "DO_NOT_LITTER" = "🚯",
      /**
       * Emoji: 🚳
       */
      "NO_BICYCLES" = "🚳",
      /**
       * Emoji: 🚱
       */
      "NON_POTABLE_WATER" = "🚱",
      /**
       * Emoji: 🔞
       */
      "UNDERAGE" = "🔞",
      /**
       * Emoji: 📵
       */
      "NO_MOBILE_PHONES" = "📵",
      /**
       * Emoji: ❗
       */
      "EXCLAMATION" = "❗",
      /**
       * Emoji: ❕
       */
      "GREY_EXCLAMATION" = "❕",
      /**
       * Emoji: ❓
       */
      "QUESTION" = "❓",
      /**
       * Emoji: ❔
       */
      "GREY_QUESTION" = "❔",
      /**
       * Emoji: ‼
       */
      "BANGBANG" = "‼",
      /**
       * Emoji: ⁉
       */
      "INTERROBANG" = "⁉",
      /**
       * Emoji: 🔅
       */
      "LOW_BRIGHTNESS" = "🔅",
      /**
       * Emoji: 🔆
       */
      "HIGH_BRIGHTNESS" = "🔆",
      /**
       * Emoji: 🔱
       */
      "TRIDENT" = "🔱",
      /**
       * Emoji: ⚜
       */
      "FLEUR_DE_LIS" = "⚜",
      /**
       * Emoji: 〽
       */
      "PART_ALTERNATION_MARK" = "〽",
      /**
       * Emoji: ⚠
       */
      "WARNING" = "⚠",
      /**
       * Emoji: 🚸
       */
      "CHILDREN_CROSSING" = "🚸",
      /**
       * Emoji: 🔰
       */
      "BEGINNER" = "🔰",
      /**
       * Emoji: ♻
       */
      "RECYCLE" = "♻",
      /**
       * Emoji: 🈯
       */
      "U6307" = "🈯",
      /**
       * Emoji: 💹
       */
      "CHART" = "💹",
      /**
       * Emoji: ❇
       */
      "SPARKLE" = "❇",
      /**
       * Emoji: ✳
       */
      "EIGHT_SPOKED_ASTERISK" = "✳",
      /**
       * Emoji: ❎
       */
      "NEGATIVE_SQUARED_CROSS_MARK" = "❎",
      /**
       * Emoji: ✅
       */
      "WHITE_CHECK_MARK" = "✅",
      /**
       * Emoji: 💠
       */
      "DIAMOND_SHAPE_WITH_A_DOT_INSIDE" = "💠",
      /**
       * Emoji: 🌀
       */
      "CYCLONE" = "🌀",
      /**
       * Emoji: ➿
       */
      "LOOP" = "➿",
      /**
       * Emoji: 🌐
       */
      "GLOBE_WITH_MERIDIANS" = "🌐",
      /**
       * Emoji: Ⓜ
       */
      "M" = "Ⓜ",
      /**
       * Emoji: 🏧
       */
      "ATM" = "🏧",
      /**
       * Emoji: 🈂
       */
      "SA" = "🈂",
      /**
       * Emoji: 🛂
       */
      "PASSPORT_CONTROL" = "🛂",
      /**
       * Emoji: 🛃
       */
      "CUSTOMS" = "🛃",
      /**
       * Emoji: 🛄
       */
      "BAGGAGE_CLAIM" = "🛄",
      /**
       * Emoji: 🛅
       */
      "LEFT_LUGGAGE" = "🛅",
      /**
       * Emoji: ♿
       */
      "WHEELCHAIR" = "♿",
      /**
       * Emoji: 🚭
       */
      "NO_SMOKING" = "🚭",
      /**
       * Emoji: 🚾
       */
      "WC" = "🚾",
      /**
       * Emoji: 🅿
       */
      "PARKING" = "🅿",
      /**
       * Emoji: 🚰
       */
      "POTABLE_WATER" = "🚰",
      /**
       * Emoji: 🚹
       */
      "MENS" = "🚹",
      /**
       * Emoji: 🚺
       */
      "WOMENS" = "🚺",
      /**
       * Emoji: 🚼
       */
      "BABY_SYMBOL" = "🚼",
      /**
       * Emoji: 🚻
       */
      "RESTROOM" = "🚻",
      /**
       * Emoji: 🚮
       */
      "PUT_LITTER_IN_ITS_PLACE" = "🚮",
      /**
       * Emoji: 🎦
       */
      "CINEMA" = "🎦",
      /**
       * Emoji: 📶
       */
      "SIGNAL_STRENGTH" = "📶",
      /**
       * Emoji: 🈁
       */
      "KOKO" = "🈁",
      /**
       * Emoji: 🆖
       */
      "NG" = "🆖",
      /**
       * Emoji: 🆗
       */
      "OK" = "🆗",
      /**
       * Emoji: 🆙
       */
      "UP" = "🆙",
      /**
       * Emoji: 🆒
       */
      "COOL" = "🆒",
      /**
       * Emoji: 🆕
       */
      "NEW" = "🆕",
      /**
       * Emoji: 🆓
       */
      "FREE" = "🆓",
      /**
       * Emoji: 0⃣
       */
      "ZERO" = "0⃣",
      /**
       * Emoji: 1⃣
       */
      "ONE" = "1⃣",
      /**
       * Emoji: 2⃣
       */
      "TWO" = "2⃣",
      /**
       * Emoji: 3⃣
       */
      "THREE" = "3⃣",
      /**
       * Emoji: 4⃣
       */
      "FOUR" = "4⃣",
      /**
       * Emoji: 5⃣
       */
      "FIVE" = "5⃣",
      /**
       * Emoji: 6⃣
       */
      "SIX" = "6⃣",
      /**
       * Emoji: 7⃣
       */
      "SEVEN" = "7⃣",
      /**
       * Emoji: 8⃣
       */
      "EIGHT" = "8⃣",
      /**
       * Emoji: 9⃣
       */
      "NINE" = "9⃣",
      /**
       * Emoji: 🔟
       */
      "KEYCAP_TEN" = "🔟",
      /**
       * Emoji: ▶
       */
      "ARROW_FORWARD" = "▶",
      /**
       * Emoji: ⏸
       *
       * Aliases: `DOUBLE_VERTICAL_BAR`
       */
      "PAUSE_BUTTON" = "⏸",
      /**
       * Emoji: ⏸
       *
       * Aliases: `PAUSE_BUTTON`
       */
      "DOUBLE_VERTICAL_BAR" = "⏸",
      /**
       * Emoji: ⏯
       */
      "PLAY_PAUSE" = "⏯",
      /**
       * Emoji: ⏹
       */
      "STOP_BUTTON" = "⏹",
      /**
       * Emoji: ⏺
       */
      "RECORD_BUTTON" = "⏺",
      /**
       * Emoji: ⏭
       *
       * Aliases: `NEXT_TRACK`
       */
      "TRACK_NEXT" = "⏭",
      /**
       * Emoji: ⏭
       *
       * Aliases: `TRACK_NEXT`
       */
      "NEXT_TRACK" = "⏭",
      /**
       * Emoji: ⏮
       *
       * Aliases: `PREVIOUS_TRACK`
       */
      "TRACK_PREVIOUS" = "⏮",
      /**
       * Emoji: ⏮
       *
       * Aliases: `TRACK_PREVIOUS`
       */
      "PREVIOUS_TRACK" = "⏮",
      /**
       * Emoji: ⏩
       */
      "FAST_FORWARD" = "⏩",
      /**
       * Emoji: ⏪
       */
      "REWIND" = "⏪",
      /**
       * Emoji: 🔀
       */
      "TWISTED_RIGHTWARDS_ARROWS" = "🔀",
      /**
       * Emoji: 🔁
       */
      "REPEAT" = "🔁",
      /**
       * Emoji: 🔂
       */
      "REPEAT_ONE" = "🔂",
      /**
       * Emoji: ◀
       */
      "ARROW_BACKWARD" = "◀",
      /**
       * Emoji: 🔼
       */
      "ARROW_UP_SMALL" = "🔼",
      /**
       * Emoji: 🔽
       */
      "ARROW_DOWN_SMALL" = "🔽",
      /**
       * Emoji: ⏫
       */
      "ARROW_DOUBLE_UP" = "⏫",
      /**
       * Emoji: ⏬
       */
      "ARROW_DOUBLE_DOWN" = "⏬",
      /**
       * Emoji: ➡
       */
      "ARROW_RIGHT" = "➡",
      /**
       * Emoji: ⬅
       */
      "ARROW_LEFT" = "⬅",
      /**
       * Emoji: ⬆
       */
      "ARROW_UP" = "⬆",
      /**
       * Emoji: ⬇
       */
      "ARROW_DOWN" = "⬇",
      /**
       * Emoji: ↗
       */
      "ARROW_UPPER_RIGHT" = "↗",
      /**
       * Emoji: ↘
       */
      "ARROW_LOWER_RIGHT" = "↘",
      /**
       * Emoji: ↙
       */
      "ARROW_LOWER_LEFT" = "↙",
      /**
       * Emoji: ↖
       */
      "ARROW_UPPER_LEFT" = "↖",
      /**
       * Emoji: ↕
       */
      "ARROW_UP_DOWN" = "↕",
      /**
       * Emoji: ↔
       */
      "LEFT_RIGHT_ARROW" = "↔",
      /**
       * Emoji: 🔄
       */
      "ARROWS_COUNTERCLOCKWISE" = "🔄",
      /**
       * Emoji: ↪
       */
      "ARROW_RIGHT_HOOK" = "↪",
      /**
       * Emoji: ↩
       */
      "LEFTWARDS_ARROW_WITH_HOOK" = "↩",
      /**
       * Emoji: ⤴
       */
      "ARROW_HEADING_UP" = "⤴",
      /**
       * Emoji: ⤵
       */
      "ARROW_HEADING_DOWN" = "⤵",
      /**
       * Emoji: #⃣
       */
      "HASH" = "#⃣",
      /**
       * Emoji: *⃣
       *
       * Aliases: `KEYCAP_ASTERISK`
       */
      "ASTERISK" = "*⃣",
      /**
       * Emoji: *⃣
       *
       * Aliases: `ASTERISK`
       */
      "KEYCAP_ASTERISK" = "*⃣",
      /**
       * Emoji: ℹ
       */
      "INFORMATION_SOURCE" = "ℹ",
      /**
       * Emoji: 🔤
       */
      "ABC" = "🔤",
      /**
       * Emoji: 🔡
       */
      "ABCD" = "🔡",
      /**
       * Emoji: 🔠
       */
      "CAPITAL_ABCD" = "🔠",
      /**
       * Emoji: 🔣
       */
      "SYMBOLS" = "🔣",
      /**
       * Emoji: 🎵
       */
      "MUSICAL_NOTE" = "🎵",
      /**
       * Emoji: 🎶
       */
      "NOTES" = "🎶",
      /**
       * Emoji: 〰
       */
      "WAVY_DASH" = "〰",
      /**
       * Emoji: ➰
       */
      "CURLY_LOOP" = "➰",
      /**
       * Emoji: ✔
       */
      "HEAVY_CHECK_MARK" = "✔",
      /**
       * Emoji: 🔃
       */
      "ARROWS_CLOCKWISE" = "🔃",
      /**
       * Emoji: ➕
       */
      "HEAVY_PLUS_SIGN" = "➕",
      /**
       * Emoji: ➖
       */
      "HEAVY_MINUS_SIGN" = "➖",
      /**
       * Emoji: ➗
       */
      "HEAVY_DIVISION_SIGN" = "➗",
      /**
       * Emoji: ✖
       */
      "HEAVY_MULTIPLICATION_X" = "✖",
      /**
       * Emoji: 💲
       */
      "HEAVY_DOLLAR_SIGN" = "💲",
      /**
       * Emoji: 💱
       */
      "CURRENCY_EXCHANGE" = "💱",
      /**
       * Emoji: ©
       */
      "COPYRIGHT" = "©",
      /**
       * Emoji: ®
       */
      "REGISTERED" = "®",
      /**
       * Emoji: ™
       */
      "TM" = "™",
      /**
       * Emoji: 🔚
       */
      "END" = "🔚",
      /**
       * Emoji: 🔙
       */
      "BACK" = "🔙",
      /**
       * Emoji: 🔛
       */
      "ON" = "🔛",
      /**
       * Emoji: 🔝
       */
      "TOP" = "🔝",
      /**
       * Emoji: 🔜
       */
      "SOON" = "🔜",
      /**
       * Emoji: ☑
       */
      "BALLOT_BOX_WITH_CHECK" = "☑",
      /**
       * Emoji: 🔘
       */
      "RADIO_BUTTON" = "🔘",
      /**
       * Emoji: ⚪
       */
      "WHITE_CIRCLE" = "⚪",
      /**
       * Emoji: ⚫
       */
      "BLACK_CIRCLE" = "⚫",
      /**
       * Emoji: 🔴
       */
      "RED_CIRCLE" = "🔴",
      /**
       * Emoji: 🔵
       *
       * Aliases: `LARGE_BLUE_CIRCLE`
       */
      "BLUE_CIRCLE" = "🔵",
      /**
       * Emoji: 🔵
       *
       * Aliases: `BLUE_CIRCLE`
       */
      "LARGE_BLUE_CIRCLE" = "🔵",
      /**
       * Emoji: 🟤
       */
      "BROWN_CIRCLE" = "🟤",
      /**
       * Emoji: 🟣
       */
      "PURPLE_CIRCLE" = "🟣",
      /**
       * Emoji: 🟢
       */
      "GREEN_CIRCLE" = "🟢",
      /**
       * Emoji: 🟡
       */
      "YELLOW_CIRCLE" = "🟡",
      /**
       * Emoji: 🟠
       */
      "ORANGE_CIRCLE" = "🟠",
      /**
       * Emoji: 🔸
       */
      "SMALL_ORANGE_DIAMOND" = "🔸",
      /**
       * Emoji: 🔹
       */
      "SMALL_BLUE_DIAMOND" = "🔹",
      /**
       * Emoji: 🔶
       */
      "LARGE_ORANGE_DIAMOND" = "🔶",
      /**
       * Emoji: 🔷
       */
      "LARGE_BLUE_DIAMOND" = "🔷",
      /**
       * Emoji: 🔺
       */
      "SMALL_RED_TRIANGLE" = "🔺",
      /**
       * Emoji: ▪
       */
      "BLACK_SMALL_SQUARE" = "▪",
      /**
       * Emoji: ▫
       */
      "WHITE_SMALL_SQUARE" = "▫",
      /**
       * Emoji: ⬛
       */
      "BLACK_LARGE_SQUARE" = "⬛",
      /**
       * Emoji: ⬜
       */
      "WHITE_LARGE_SQUARE" = "⬜",
      /**
       * Emoji: 🟥
       */
      "RED_SQUARE" = "🟥",
      /**
       * Emoji: 🟧
       */
      "ORANGE_SQUARE" = "🟧",
      /**
       * Emoji: 🟨
       */
      "YELLOW_SQUARE" = "🟨",
      /**
       * Emoji: 🟩
       */
      "GREEN_SQUARE" = "🟩",
      /**
       * Emoji: 🟦
       */
      "BLUE_SQUARE" = "🟦",
      /**
       * Emoji: 🟪
       */
      "PURPLE_SQUARE" = "🟪",
      /**
       * Emoji: 🟫
       */
      "BROWN_SQUARE" = "🟫",
      /**
       * Emoji: 🔻
       */
      "SMALL_RED_TRIANGLE_DOWN" = "🔻",
      /**
       * Emoji: ◼
       */
      "BLACK_MEDIUM_SQUARE" = "◼",
      /**
       * Emoji: ◻
       */
      "WHITE_MEDIUM_SQUARE" = "◻",
      /**
       * Emoji: ◾
       */
      "BLACK_MEDIUM_SMALL_SQUARE" = "◾",
      /**
       * Emoji: ◽
       */
      "WHITE_MEDIUM_SMALL_SQUARE" = "◽",
      /**
       * Emoji: 🔲
       */
      "BLACK_SQUARE_BUTTON" = "🔲",
      /**
       * Emoji: 🔳
       */
      "WHITE_SQUARE_BUTTON" = "🔳",
      /**
       * Emoji: 🔈
       */
      "SPEAKER" = "🔈",
      /**
       * Emoji: 🔉
       */
      "SOUND" = "🔉",
      /**
       * Emoji: 🔊
       */
      "LOUD_SOUND" = "🔊",
      /**
       * Emoji: 🔇
       */
      "MUTE" = "🔇",
      /**
       * Emoji: 📣
       */
      "MEGA" = "📣",
      /**
       * Emoji: 📢
       */
      "LOUDSPEAKER" = "📢",
      /**
       * Emoji: 🔔
       */
      "BELL" = "🔔",
      /**
       * Emoji: 🔕
       */
      "NO_BELL" = "🔕",
      /**
       * Emoji: 🃏
       */
      "BLACK_JOKER" = "🃏",
      /**
       * Emoji: 🀄
       */
      "MAHJONG" = "🀄",
      /**
       * Emoji: ♠
       */
      "SPADES" = "♠",
      /**
       * Emoji: ♣
       */
      "CLUBS" = "♣",
      /**
       * Emoji: ♥
       */
      "HEARTS" = "♥",
      /**
       * Emoji: ♦
       */
      "DIAMONDS" = "♦",
      /**
       * Emoji: 🎴
       */
      "FLOWER_PLAYING_CARDS" = "🎴",
      /**
       * Emoji: 💭
       */
      "THOUGHT_BALLOON" = "💭",
      /**
       * Emoji: 🗯
       *
       * Aliases: `RIGHT_ANGER_BUBBLE`
       */
      "ANGER_RIGHT" = "🗯",
      /**
       * Emoji: 🗯
       *
       * Aliases: `ANGER_RIGHT`
       */
      "RIGHT_ANGER_BUBBLE" = "🗯",
      /**
       * Emoji: 💬
       */
      "SPEECH_BALLOON" = "💬",
      /**
       * Emoji: 🕐
       */
      "CLOCK1" = "🕐",
      /**
       * Emoji: 🕑
       */
      "CLOCK2" = "🕑",
      /**
       * Emoji: 🕒
       */
      "CLOCK3" = "🕒",
      /**
       * Emoji: 🕓
       */
      "CLOCK4" = "🕓",
      /**
       * Emoji: 🕔
       */
      "CLOCK5" = "🕔",
      /**
       * Emoji: 🕕
       */
      "CLOCK6" = "🕕",
      /**
       * Emoji: 🕖
       */
      "CLOCK7" = "🕖",
      /**
       * Emoji: 🕗
       */
      "CLOCK8" = "🕗",
      /**
       * Emoji: 🕘
       */
      "CLOCK9" = "🕘",
      /**
       * Emoji: 🕙
       */
      "CLOCK10" = "🕙",
      /**
       * Emoji: 🕚
       */
      "CLOCK11" = "🕚",
      /**
       * Emoji: 🕛
       */
      "CLOCK12" = "🕛",
      /**
       * Emoji: 🕜
       */
      "CLOCK130" = "🕜",
      /**
       * Emoji: 🕝
       */
      "CLOCK230" = "🕝",
      /**
       * Emoji: 🕞
       */
      "CLOCK330" = "🕞",
      /**
       * Emoji: 🕟
       */
      "CLOCK430" = "🕟",
      /**
       * Emoji: 🕠
       */
      "CLOCK530" = "🕠",
      /**
       * Emoji: 🕡
       */
      "CLOCK630" = "🕡",
      /**
       * Emoji: 🕢
       */
      "CLOCK730" = "🕢",
      /**
       * Emoji: 🕣
       */
      "CLOCK830" = "🕣",
      /**
       * Emoji: 🕤
       */
      "CLOCK930" = "🕤",
      /**
       * Emoji: 🕥
       */
      "CLOCK1030" = "🕥",
      /**
       * Emoji: 🕦
       */
      "CLOCK1130" = "🕦",
      /**
       * Emoji: 🕧
       */
      "CLOCK1230" = "🕧",
      /**
       * Emoji: 👁‍🗨
       */
      "EYE_IN_SPEECH_BUBBLE" = "👁‍🗨",
      /**
       * Emoji: 🗨
       *
       * Aliases: `LEFT_SPEECH_BUBBLE`
       */
      "SPEECH_LEFT" = "🗨",
      /**
       * Emoji: 🗨
       *
       * Aliases: `SPEECH_LEFT`
       */
      "LEFT_SPEECH_BUBBLE" = "🗨",
      /**
       * Emoji: ⏏
       *
       * Aliases: `EJECT_SYMBOL`
       */
      "EJECT" = "⏏",
      /**
       * Emoji: ⏏
       *
       * Aliases: `EJECT`
       */
      "EJECT_SYMBOL" = "⏏",
      /**
       * Emoji: 🛑
       *
       * Aliases: `STOP_SIGN`
       */
      "OCTAGONAL_SIGN" = "🛑",
      /**
       * Emoji: 🛑
       *
       * Aliases: `OCTAGONAL_SIGN`
       */
      "STOP_SIGN" = "🛑",
      /**
       * Emoji: 🇿
       */
      "REGIONAL_INDICATOR_Z" = "🇿",
      /**
       * Emoji: 🇾
       */
      "REGIONAL_INDICATOR_Y" = "🇾",
      /**
       * Emoji: 🇽
       */
      "REGIONAL_INDICATOR_X" = "🇽",
      /**
       * Emoji: 🇼
       */
      "REGIONAL_INDICATOR_W" = "🇼",
      /**
       * Emoji: 🇻
       */
      "REGIONAL_INDICATOR_V" = "🇻",
      /**
       * Emoji: 🇺
       */
      "REGIONAL_INDICATOR_U" = "🇺",
      /**
       * Emoji: 🇹
       */
      "REGIONAL_INDICATOR_T" = "🇹",
      /**
       * Emoji: 🇸
       */
      "REGIONAL_INDICATOR_S" = "🇸",
      /**
       * Emoji: 🇷
       */
      "REGIONAL_INDICATOR_R" = "🇷",
      /**
       * Emoji: 🇶
       */
      "REGIONAL_INDICATOR_Q" = "🇶",
      /**
       * Emoji: 🇵
       */
      "REGIONAL_INDICATOR_P" = "🇵",
      /**
       * Emoji: 🇴
       */
      "REGIONAL_INDICATOR_O" = "🇴",
      /**
       * Emoji: 🇳
       */
      "REGIONAL_INDICATOR_N" = "🇳",
      /**
       * Emoji: 🇲
       */
      "REGIONAL_INDICATOR_M" = "🇲",
      /**
       * Emoji: 🇱
       */
      "REGIONAL_INDICATOR_L" = "🇱",
      /**
       * Emoji: 🇰
       */
      "REGIONAL_INDICATOR_K" = "🇰",
      /**
       * Emoji: 🇯
       */
      "REGIONAL_INDICATOR_J" = "🇯",
      /**
       * Emoji: 🇮
       */
      "REGIONAL_INDICATOR_I" = "🇮",
      /**
       * Emoji: 🇭
       */
      "REGIONAL_INDICATOR_H" = "🇭",
      /**
       * Emoji: 🇬
       */
      "REGIONAL_INDICATOR_G" = "🇬",
      /**
       * Emoji: 🇫
       */
      "REGIONAL_INDICATOR_F" = "🇫",
      /**
       * Emoji: 🇪
       */
      "REGIONAL_INDICATOR_E" = "🇪",
      /**
       * Emoji: 🇩
       */
      "REGIONAL_INDICATOR_D" = "🇩",
      /**
       * Emoji: 🇨
       */
      "REGIONAL_INDICATOR_C" = "🇨",
      /**
       * Emoji: 🇧
       */
      "REGIONAL_INDICATOR_B" = "🇧",
      /**
       * Emoji: 🇦
       */
      "REGIONAL_INDICATOR_A" = "🇦",
      /**
       * Emoji: ♾️
       */
      "INFINITY" = "♾️",
      /**
       * Emoji: ♀️
       *
       * Aliases: `FEMALE`
       */
      "FEMALE_SIGN" = "♀️",
      /**
       * Emoji: ♀️
       *
       * Aliases: `FEMALE_SIGN`
       */
      "FEMALE" = "♀️",
      /**
       * Emoji: ♂️
       *
       * Aliases: `MALE`
       */
      "MALE_SIGN" = "♂️",
      /**
       * Emoji: ♂️
       *
       * Aliases: `MALE_SIGN`
       */
      "MALE" = "♂️",
      /**
       * Emoji: ⚕️
       *
       * Aliases: `STAFF_OF_AESCULAPIUS`
       */
      "MEDICAL_SYMBOL" = "⚕️",
      /**
       * Emoji: ⚕️
       *
       * Aliases: `MEDICAL_SYMBOL`
       */
      "STAFF_OF_AESCULAPIUS" = "⚕️",
      /**
       * Emoji: ⚧️
       *
       * Aliases: `TRANS_SYMBOL`
       */
      "TRANSGENDER_SYMBOL" = "⚧️",
      /**
       * Emoji: ⚧️
       *
       * Aliases: `TRANSGENDER_SYMBOL`
       */
      "TRANS_SYMBOL" = "⚧️",
      /**
       * Emoji: 🏳
       */
      "FLAG_WHITE" = "🏳",
      /**
       * Emoji: 🏴
       */
      "FLAG_BLACK" = "🏴",
      /**
       * Emoji: 🏁
       */
      "CHECKERED_FLAG" = "🏁",
      /**
       * Emoji: 🚩
       */
      "TRIANGULAR_FLAG_ON_POST" = "🚩",
      /**
       * Emoji: 🏳️‍🌈
       *
       * Aliases: `GAY_PRIDE_FLAG`
       */
      "RAINBOW_FLAG" = "🏳️‍🌈",
      /**
       * Emoji: 🏳️‍🌈
       *
       * Aliases: `RAINBOW_FLAG`
       */
      "GAY_PRIDE_FLAG" = "🏳️‍🌈",
      /**
       * Emoji: 🏳️‍⚧️
       *
       * Aliases: `TRANS_FLAG`
       */
      "TRANSGENDER_FLAG" = "🏳️‍⚧️",
      /**
       * Emoji: 🏳️‍⚧️
       *
       * Aliases: `TRANSGENDER_FLAG`
       */
      "TRANS_FLAG" = "🏳️‍⚧️",
      /**
       * Emoji: 🏴‍☠️
       *
       * Aliases: `PIRATE`,`JOLLY_ROGER`
       */
      "PIRATE_FLAG" = "🏴‍☠️",
      /**
       * Emoji: 🏴‍☠️
       *
       * Aliases: `PIRATE_FLAG`,`JOLLY_ROGER`
       */
      "PIRATE" = "🏴‍☠️",
      /**
       * Emoji: 🏴‍☠️
       *
       * Aliases: `PIRATE_FLAG`,`PIRATE`
       */
      "JOLLY_ROGER" = "🏴‍☠️",
      /**
       * Emoji: 🇦🇨
       */
      "FLAG_AC" = "🇦🇨",
      /**
       * Emoji: 🇦🇫
       */
      "FLAG_AF" = "🇦🇫",
      /**
       * Emoji: 🇦🇱
       */
      "FLAG_AL" = "🇦🇱",
      /**
       * Emoji: 🇩🇿
       */
      "FLAG_DZ" = "🇩🇿",
      /**
       * Emoji: 🇦🇩
       */
      "FLAG_AD" = "🇦🇩",
      /**
       * Emoji: 🇦🇴
       */
      "FLAG_AO" = "🇦🇴",
      /**
       * Emoji: 🇦🇮
       */
      "FLAG_AI" = "🇦🇮",
      /**
       * Emoji: 🇦🇬
       */
      "FLAG_AG" = "🇦🇬",
      /**
       * Emoji: 🇦🇷
       */
      "FLAG_AR" = "🇦🇷",
      /**
       * Emoji: 🇦🇲
       */
      "FLAG_AM" = "🇦🇲",
      /**
       * Emoji: 🇦🇼
       */
      "FLAG_AW" = "🇦🇼",
      /**
       * Emoji: 🇦🇺
       */
      "FLAG_AU" = "🇦🇺",
      /**
       * Emoji: 🇦🇹
       */
      "FLAG_AT" = "🇦🇹",
      /**
       * Emoji: 🇦🇿
       */
      "FLAG_AZ" = "🇦🇿",
      /**
       * Emoji: 🇧🇸
       */
      "FLAG_BS" = "🇧🇸",
      /**
       * Emoji: 🇧🇭
       */
      "FLAG_BH" = "🇧🇭",
      /**
       * Emoji: 🇧🇩
       */
      "FLAG_BD" = "🇧🇩",
      /**
       * Emoji: 🇧🇧
       */
      "FLAG_BB" = "🇧🇧",
      /**
       * Emoji: 🇧🇾
       */
      "FLAG_BY" = "🇧🇾",
      /**
       * Emoji: 🇧🇪
       */
      "FLAG_BE" = "🇧🇪",
      /**
       * Emoji: 🇧🇿
       */
      "FLAG_BZ" = "🇧🇿",
      /**
       * Emoji: 🇧🇯
       */
      "FLAG_BJ" = "🇧🇯",
      /**
       * Emoji: 🇧🇲
       */
      "FLAG_BM" = "🇧🇲",
      /**
       * Emoji: 🇧🇹
       */
      "FLAG_BT" = "🇧🇹",
      /**
       * Emoji: 🇧🇴
       */
      "FLAG_BO" = "🇧🇴",
      /**
       * Emoji: 🇧🇦
       */
      "FLAG_BA" = "🇧🇦",
      /**
       * Emoji: 🇧🇼
       */
      "FLAG_BW" = "🇧🇼",
      /**
       * Emoji: 🇧🇷
       */
      "FLAG_BR" = "🇧🇷",
      /**
       * Emoji: 🇧🇳
       */
      "FLAG_BN" = "🇧🇳",
      /**
       * Emoji: 🇧🇬
       */
      "FLAG_BG" = "🇧🇬",
      /**
       * Emoji: 🇧🇫
       */
      "FLAG_BF" = "🇧🇫",
      /**
       * Emoji: 🇧🇮
       */
      "FLAG_BI" = "🇧🇮",
      /**
       * Emoji: 🇨🇻
       */
      "FLAG_CV" = "🇨🇻",
      /**
       * Emoji: 🇰🇭
       */
      "FLAG_KH" = "🇰🇭",
      /**
       * Emoji: 🇨🇲
       */
      "FLAG_CM" = "🇨🇲",
      /**
       * Emoji: 🇨🇦
       */
      "FLAG_CA" = "🇨🇦",
      /**
       * Emoji: 🇰🇾
       */
      "FLAG_KY" = "🇰🇾",
      /**
       * Emoji: 🇨🇫
       */
      "FLAG_CF" = "🇨🇫",
      /**
       * Emoji: 🇹🇩
       */
      "FLAG_TD" = "🇹🇩",
      /**
       * Emoji: 🇨🇱
       */
      "FLAG_CL" = "🇨🇱",
      /**
       * Emoji: 🇨🇳
       */
      "FLAG_CN" = "🇨🇳",
      /**
       * Emoji: 🇨🇴
       */
      "FLAG_CO" = "🇨🇴",
      /**
       * Emoji: 🇰🇲
       */
      "FLAG_KM" = "🇰🇲",
      /**
       * Emoji: 🇨🇬
       */
      "FLAG_CG" = "🇨🇬",
      /**
       * Emoji: 🇨🇩
       */
      "FLAG_CD" = "🇨🇩",
      /**
       * Emoji: 🇨🇷
       */
      "FLAG_CR" = "🇨🇷",
      /**
       * Emoji: 🇭🇷
       */
      "FLAG_HR" = "🇭🇷",
      /**
       * Emoji: 🇨🇺
       */
      "FLAG_CU" = "🇨🇺",
      /**
       * Emoji: 🇨🇾
       */
      "FLAG_CY" = "🇨🇾",
      /**
       * Emoji: 🇨🇿
       */
      "FLAG_CZ" = "🇨🇿",
      /**
       * Emoji: 🇩🇰
       */
      "FLAG_DK" = "🇩🇰",
      /**
       * Emoji: 🇩🇯
       */
      "FLAG_DJ" = "🇩🇯",
      /**
       * Emoji: 🇩🇲
       */
      "FLAG_DM" = "🇩🇲",
      /**
       * Emoji: 🇩🇴
       */
      "FLAG_DO" = "🇩🇴",
      /**
       * Emoji: 🇪🇨
       */
      "FLAG_EC" = "🇪🇨",
      /**
       * Emoji: 🇪🇬
       */
      "FLAG_EG" = "🇪🇬",
      /**
       * Emoji: 🇸🇻
       */
      "FLAG_SV" = "🇸🇻",
      /**
       * Emoji: 🇬🇶
       */
      "FLAG_GQ" = "🇬🇶",
      /**
       * Emoji: 🇪🇷
       */
      "FLAG_ER" = "🇪🇷",
      /**
       * Emoji: 🇪🇪
       */
      "FLAG_EE" = "🇪🇪",
      /**
       * Emoji: 🇪🇹
       */
      "FLAG_ET" = "🇪🇹",
      /**
       * Emoji: 🇫🇰
       */
      "FLAG_FK" = "🇫🇰",
      /**
       * Emoji: 🇫🇴
       */
      "FLAG_FO" = "🇫🇴",
      /**
       * Emoji: 🇫🇯
       */
      "FLAG_FJ" = "🇫🇯",
      /**
       * Emoji: 🇫🇮
       */
      "FLAG_FI" = "🇫🇮",
      /**
       * Emoji: 🇫🇷
       */
      "FLAG_FR" = "🇫🇷",
      /**
       * Emoji: 🇵🇫
       */
      "FLAG_PF" = "🇵🇫",
      /**
       * Emoji: 🇬🇦
       */
      "FLAG_GA" = "🇬🇦",
      /**
       * Emoji: 🇬🇲
       */
      "FLAG_GM" = "🇬🇲",
      /**
       * Emoji: 🇬🇪
       */
      "FLAG_GE" = "🇬🇪",
      /**
       * Emoji: 🇩🇪
       */
      "FLAG_DE" = "🇩🇪",
      /**
       * Emoji: 🇬🇭
       */
      "FLAG_GH" = "🇬🇭",
      /**
       * Emoji: 🇬🇮
       */
      "FLAG_GI" = "🇬🇮",
      /**
       * Emoji: 🇬🇷
       */
      "FLAG_GR" = "🇬🇷",
      /**
       * Emoji: 🇬🇱
       */
      "FLAG_GL" = "🇬🇱",
      /**
       * Emoji: 🇬🇩
       */
      "FLAG_GD" = "🇬🇩",
      /**
       * Emoji: 🇬🇺
       */
      "FLAG_GU" = "🇬🇺",
      /**
       * Emoji: 🇬🇹
       */
      "FLAG_GT" = "🇬🇹",
      /**
       * Emoji: 🇬🇳
       */
      "FLAG_GN" = "🇬🇳",
      /**
       * Emoji: 🇬🇼
       */
      "FLAG_GW" = "🇬🇼",
      /**
       * Emoji: 🇬🇾
       */
      "FLAG_GY" = "🇬🇾",
      /**
       * Emoji: 🇭🇹
       */
      "FLAG_HT" = "🇭🇹",
      /**
       * Emoji: 🇭🇳
       */
      "FLAG_HN" = "🇭🇳",
      /**
       * Emoji: 🇭🇰
       */
      "FLAG_HK" = "🇭🇰",
      /**
       * Emoji: 🇭🇺
       */
      "FLAG_HU" = "🇭🇺",
      /**
       * Emoji: 🇮🇸
       */
      "FLAG_IS" = "🇮🇸",
      /**
       * Emoji: 🇮🇳
       */
      "FLAG_IN" = "🇮🇳",
      /**
       * Emoji: 🇮🇩
       */
      "FLAG_ID" = "🇮🇩",
      /**
       * Emoji: 🇮🇷
       */
      "FLAG_IR" = "🇮🇷",
      /**
       * Emoji: 🇮🇶
       */
      "FLAG_IQ" = "🇮🇶",
      /**
       * Emoji: 🇮🇪
       */
      "FLAG_IE" = "🇮🇪",
      /**
       * Emoji: 🇮🇱
       */
      "FLAG_IL" = "🇮🇱",
      /**
       * Emoji: 🇮🇹
       */
      "FLAG_IT" = "🇮🇹",
      /**
       * Emoji: 🇨🇮
       */
      "FLAG_CI" = "🇨🇮",
      /**
       * Emoji: 🇯🇲
       */
      "FLAG_JM" = "🇯🇲",
      /**
       * Emoji: 🇯🇵
       */
      "FLAG_JP" = "🇯🇵",
      /**
       * Emoji: 🇯🇪
       */
      "FLAG_JE" = "🇯🇪",
      /**
       * Emoji: 🇯🇴
       */
      "FLAG_JO" = "🇯🇴",
      /**
       * Emoji: 🇰🇿
       */
      "FLAG_KZ" = "🇰🇿",
      /**
       * Emoji: 🇰🇪
       */
      "FLAG_KE" = "🇰🇪",
      /**
       * Emoji: 🇰🇮
       */
      "FLAG_KI" = "🇰🇮",
      /**
       * Emoji: 🇽🇰
       */
      "FLAG_XK" = "🇽🇰",
      /**
       * Emoji: 🇰🇼
       */
      "FLAG_KW" = "🇰🇼",
      /**
       * Emoji: 🇰🇬
       */
      "FLAG_KG" = "🇰🇬",
      /**
       * Emoji: 🇱🇦
       */
      "FLAG_LA" = "🇱🇦",
      /**
       * Emoji: 🇱🇻
       */
      "FLAG_LV" = "🇱🇻",
      /**
       * Emoji: 🇱🇧
       */
      "FLAG_LB" = "🇱🇧",
      /**
       * Emoji: 🇱🇸
       */
      "FLAG_LS" = "🇱🇸",
      /**
       * Emoji: 🇱🇷
       */
      "FLAG_LR" = "🇱🇷",
      /**
       * Emoji: 🇱🇾
       */
      "FLAG_LY" = "🇱🇾",
      /**
       * Emoji: 🇱🇮
       */
      "FLAG_LI" = "🇱🇮",
      /**
       * Emoji: 🇱🇹
       */
      "FLAG_LT" = "🇱🇹",
      /**
       * Emoji: 🇱🇺
       */
      "FLAG_LU" = "🇱🇺",
      /**
       * Emoji: 🇲🇴
       */
      "FLAG_MO" = "🇲🇴",
      /**
       * Emoji: 🇲🇰
       */
      "FLAG_MK" = "🇲🇰",
      /**
       * Emoji: 🇲🇬
       */
      "FLAG_MG" = "🇲🇬",
      /**
       * Emoji: 🇲🇼
       */
      "FLAG_MW" = "🇲🇼",
      /**
       * Emoji: 🇲🇾
       */
      "FLAG_MY" = "🇲🇾",
      /**
       * Emoji: 🇲🇻
       */
      "FLAG_MV" = "🇲🇻",
      /**
       * Emoji: 🇲🇱
       */
      "FLAG_ML" = "🇲🇱",
      /**
       * Emoji: 🇲🇹
       */
      "FLAG_MT" = "🇲🇹",
      /**
       * Emoji: 🇲🇭
       */
      "FLAG_MH" = "🇲🇭",
      /**
       * Emoji: 🇲🇷
       */
      "FLAG_MR" = "🇲🇷",
      /**
       * Emoji: 🇲🇺
       */
      "FLAG_MU" = "🇲🇺",
      /**
       * Emoji: 🇲🇽
       */
      "FLAG_MX" = "🇲🇽",
      /**
       * Emoji: 🇫🇲
       */
      "FLAG_FM" = "🇫🇲",
      /**
       * Emoji: 🇲🇩
       */
      "FLAG_MD" = "🇲🇩",
      /**
       * Emoji: 🇲🇨
       */
      "FLAG_MC" = "🇲🇨",
      /**
       * Emoji: 🇲🇳
       */
      "FLAG_MN" = "🇲🇳",
      /**
       * Emoji: 🇲🇪
       */
      "FLAG_ME" = "🇲🇪",
      /**
       * Emoji: 🇲🇸
       */
      "FLAG_MS" = "🇲🇸",
      /**
       * Emoji: 🇲🇦
       */
      "FLAG_MA" = "🇲🇦",
      /**
       * Emoji: 🇲🇿
       */
      "FLAG_MZ" = "🇲🇿",
      /**
       * Emoji: 🇲🇲
       */
      "FLAG_MM" = "🇲🇲",
      /**
       * Emoji: 🇳🇦
       */
      "FLAG_NA" = "🇳🇦",
      /**
       * Emoji: 🇳🇷
       */
      "FLAG_NR" = "🇳🇷",
      /**
       * Emoji: 🇳🇵
       */
      "FLAG_NP" = "🇳🇵",
      /**
       * Emoji: 🇳🇱
       */
      "FLAG_NL" = "🇳🇱",
      /**
       * Emoji: 🇳🇨
       */
      "FLAG_NC" = "🇳🇨",
      /**
       * Emoji: 🇳🇿
       */
      "FLAG_NZ" = "🇳🇿",
      /**
       * Emoji: 🇳🇮
       */
      "FLAG_NI" = "🇳🇮",
      /**
       * Emoji: 🇳🇪
       */
      "FLAG_NE" = "🇳🇪",
      /**
       * Emoji: 🇳🇬
       */
      "FLAG_NG" = "🇳🇬",
      /**
       * Emoji: 🇳🇺
       */
      "FLAG_NU" = "🇳🇺",
      /**
       * Emoji: 🇰🇵
       */
      "FLAG_KP" = "🇰🇵",
      /**
       * Emoji: 🇳🇴
       */
      "FLAG_NO" = "🇳🇴",
      /**
       * Emoji: 🇴🇲
       */
      "FLAG_OM" = "🇴🇲",
      /**
       * Emoji: 🇵🇰
       */
      "FLAG_PK" = "🇵🇰",
      /**
       * Emoji: 🇵🇼
       */
      "FLAG_PW" = "🇵🇼",
      /**
       * Emoji: 🇵🇸
       */
      "FLAG_PS" = "🇵🇸",
      /**
       * Emoji: 🇵🇦
       */
      "FLAG_PA" = "🇵🇦",
      /**
       * Emoji: 🇵🇬
       */
      "FLAG_PG" = "🇵🇬",
      /**
       * Emoji: 🇵🇾
       */
      "FLAG_PY" = "🇵🇾",
      /**
       * Emoji: 🇵🇪
       */
      "FLAG_PE" = "🇵🇪",
      /**
       * Emoji: 🇵🇭
       */
      "FLAG_PH" = "🇵🇭",
      /**
       * Emoji: 🇵🇱
       */
      "FLAG_PL" = "🇵🇱",
      /**
       * Emoji: 🇵🇹
       */
      "FLAG_PT" = "🇵🇹",
      /**
       * Emoji: 🇵🇷
       */
      "FLAG_PR" = "🇵🇷",
      /**
       * Emoji: 🇶🇦
       */
      "FLAG_QA" = "🇶🇦",
      /**
       * Emoji: 🇷🇴
       */
      "FLAG_RO" = "🇷🇴",
      /**
       * Emoji: 🇷🇺
       */
      "FLAG_RU" = "🇷🇺",
      /**
       * Emoji: 🇷🇼
       */
      "FLAG_RW" = "🇷🇼",
      /**
       * Emoji: 🇸🇭
       */
      "FLAG_SH" = "🇸🇭",
      /**
       * Emoji: 🇰🇳
       */
      "FLAG_KN" = "🇰🇳",
      /**
       * Emoji: 🇱🇨
       */
      "FLAG_LC" = "🇱🇨",
      /**
       * Emoji: 🇻🇨
       */
      "FLAG_VC" = "🇻🇨",
      /**
       * Emoji: 🇼🇸
       */
      "FLAG_WS" = "🇼🇸",
      /**
       * Emoji: 🇸🇲
       */
      "FLAG_SM" = "🇸🇲",
      /**
       * Emoji: 🇸🇹
       */
      "FLAG_ST" = "🇸🇹",
      /**
       * Emoji: 🇸🇦
       */
      "FLAG_SA" = "🇸🇦",
      /**
       * Emoji: 🇸🇳
       */
      "FLAG_SN" = "🇸🇳",
      /**
       * Emoji: 🇷🇸
       */
      "FLAG_RS" = "🇷🇸",
      /**
       * Emoji: 🇸🇨
       */
      "FLAG_SC" = "🇸🇨",
      /**
       * Emoji: 🇸🇱
       */
      "FLAG_SL" = "🇸🇱",
      /**
       * Emoji: 🇸🇬
       */
      "FLAG_SG" = "🇸🇬",
      /**
       * Emoji: 🇸🇰
       */
      "FLAG_SK" = "🇸🇰",
      /**
       * Emoji: 🇸🇮
       */
      "FLAG_SI" = "🇸🇮",
      /**
       * Emoji: 🇸🇧
       */
      "FLAG_SB" = "🇸🇧",
      /**
       * Emoji: 🇸🇴
       */
      "FLAG_SO" = "🇸🇴",
      /**
       * Emoji: 🇿🇦
       */
      "FLAG_ZA" = "🇿🇦",
      /**
       * Emoji: 🇰🇷
       */
      "FLAG_KR" = "🇰🇷",
      /**
       * Emoji: 🇪🇸
       */
      "FLAG_ES" = "🇪🇸",
      /**
       * Emoji: 🇱🇰
       */
      "FLAG_LK" = "🇱🇰",
      /**
       * Emoji: 🇸🇩
       */
      "FLAG_SD" = "🇸🇩",
      /**
       * Emoji: 🇸🇷
       */
      "FLAG_SR" = "🇸🇷",
      /**
       * Emoji: 🇸🇿
       */
      "FLAG_SZ" = "🇸🇿",
      /**
       * Emoji: 🇸🇪
       */
      "FLAG_SE" = "🇸🇪",
      /**
       * Emoji: 🇨🇭
       */
      "FLAG_CH" = "🇨🇭",
      /**
       * Emoji: 🇸🇾
       */
      "FLAG_SY" = "🇸🇾",
      /**
       * Emoji: 🇹🇼
       */
      "FLAG_TW" = "🇹🇼",
      /**
       * Emoji: 🇹🇯
       */
      "FLAG_TJ" = "🇹🇯",
      /**
       * Emoji: 🇹🇿
       */
      "FLAG_TZ" = "🇹🇿",
      /**
       * Emoji: 🇹🇭
       */
      "FLAG_TH" = "🇹🇭",
      /**
       * Emoji: 🇹🇱
       */
      "FLAG_TL" = "🇹🇱",
      /**
       * Emoji: 🇹🇬
       */
      "FLAG_TG" = "🇹🇬",
      /**
       * Emoji: 🇹🇴
       */
      "FLAG_TO" = "🇹🇴",
      /**
       * Emoji: 🇹🇹
       */
      "FLAG_TT" = "🇹🇹",
      /**
       * Emoji: 🇹🇳
       */
      "FLAG_TN" = "🇹🇳",
      /**
       * Emoji: 🇹🇷
       */
      "FLAG_TR" = "🇹🇷",
      /**
       * Emoji: 🇹🇲
       */
      "FLAG_TM" = "🇹🇲",
      /**
       * Emoji: 🇹🇻
       */
      "FLAG_TV" = "🇹🇻",
      /**
       * Emoji: 🇺🇬
       */
      "FLAG_UG" = "🇺🇬",
      /**
       * Emoji: 🇺🇦
       */
      "FLAG_UA" = "🇺🇦",
      /**
       * Emoji: 🇦🇪
       */
      "FLAG_AE" = "🇦🇪",
      /**
       * Emoji: 🇬🇧
       *
       * Aliases: `FLAG_UK`,`BRITAIN`,`UNITED_KINGDOM`
       */
      "FLAG_GB" = "🇬🇧",
      /**
       * Emoji: 🇬🇧
       *
       * Aliases: `FLAG_GB`,`BRITAIN`,`UNITED_KINGDOM`
       */
      "FLAG_UK" = "🇬🇧",
      /**
       * Emoji: 🇬🇧
       *
       * Aliases: `FLAG_GB`,`FLAG_UK`,`UNITED_KINGDOM`
       */
      "BRITAIN" = "🇬🇧",
      /**
       * Emoji: 🇬🇧
       *
       * Aliases: `FLAG_GB`,`FLAG_UK`,`BRITAIN`
       */
      "UNITED_KINGDOM" = "🇬🇧",
      /**
       * Emoji: 🏴󠁧󠁢󠁥󠁮󠁧󠁿
       *
       * Aliases: `FLAG_ENG`,`FLAG_EN`
       */
      "ENGLAND" = "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
      /**
       * Emoji: 🏴󠁧󠁢󠁥󠁮󠁧󠁿
       *
       * Aliases: `ENGLAND`,`FLAG_EN`
       */
      "FLAG_ENG" = "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
      /**
       * Emoji: 🏴󠁧󠁢󠁥󠁮󠁧󠁿
       *
       * Aliases: `ENGLAND`,`FLAG_ENG`
       */
      "FLAG_EN" = "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
      /**
       * Emoji: 🏴󠁧󠁢󠁳󠁣󠁴󠁿
       *
       * Aliases: `FLAG_SCT`
       */
      "SCOTLAND" = "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
      /**
       * Emoji: 🏴󠁧󠁢󠁳󠁣󠁴󠁿
       *
       * Aliases: `SCOTLAND`
       */
      "FLAG_SCT" = "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
      /**
       * Emoji: 🏴󠁧󠁢󠁷󠁬󠁳󠁿
       *
       * Aliases: `FLAG_WLS`
       */
      "WALES" = "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
      /**
       * Emoji: 🏴󠁧󠁢󠁷󠁬󠁳󠁿
       *
       * Aliases: `WALES`
       */
      "FLAG_WLS" = "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
      /**
       * Emoji: 🇺🇸
       *
       * Aliases: `UNITED_STATES`
       */
      "FLAG_US" = "🇺🇸",
      /**
       * Emoji: 🇺🇸
       *
       * Aliases: `FLAG_US`
       */
      "UNITED_STATES" = "🇺🇸",
      /**
       * Emoji: 🇻🇮
       */
      "FLAG_VI" = "🇻🇮",
      /**
       * Emoji: 🇺🇾
       */
      "FLAG_UY" = "🇺🇾",
      /**
       * Emoji: 🇺🇿
       */
      "FLAG_UZ" = "🇺🇿",
      /**
       * Emoji: 🇻🇺
       */
      "FLAG_VU" = "🇻🇺",
      /**
       * Emoji: 🇻🇦
       */
      "FLAG_VA" = "🇻🇦",
      /**
       * Emoji: 🇻🇪
       */
      "FLAG_VE" = "🇻🇪",
      /**
       * Emoji: 🇻🇳
       */
      "FLAG_VN" = "🇻🇳",
      /**
       * Emoji: 🇼🇫
       */
      "FLAG_WF" = "🇼🇫",
      /**
       * Emoji: 🇪🇭
       */
      "FLAG_EH" = "🇪🇭",
      /**
       * Emoji: 🇾🇪
       */
      "FLAG_YE" = "🇾🇪",
      /**
       * Emoji: 🇿🇲
       */
      "FLAG_ZM" = "🇿🇲",
      /**
       * Emoji: 🇿🇼
       */
      "FLAG_ZW" = "🇿🇼",
      /**
       * Emoji: 🇷🇪
       */
      "FLAG_RE" = "🇷🇪",
      /**
       * Emoji: 🇦🇽
       */
      "FLAG_AX" = "🇦🇽",
      /**
       * Emoji: 🇹🇦
       */
      "FLAG_TA" = "🇹🇦",
      /**
       * Emoji: 🇮🇴
       */
      "FLAG_IO" = "🇮🇴",
      /**
       * Emoji: 🇧🇶
       */
      "FLAG_BQ" = "🇧🇶",
      /**
       * Emoji: 🇨🇽
       */
      "FLAG_CX" = "🇨🇽",
      /**
       * Emoji: 🇨🇨
       */
      "FLAG_CC" = "🇨🇨",
      /**
       * Emoji: 🇬🇬
       */
      "FLAG_GG" = "🇬🇬",
      /**
       * Emoji: 🇮🇲
       */
      "FLAG_IM" = "🇮🇲",
      /**
       * Emoji: 🇾🇹
       */
      "FLAG_YT" = "🇾🇹",
      /**
       * Emoji: 🇳🇫
       */
      "FLAG_NF" = "🇳🇫",
      /**
       * Emoji: 🇵🇳
       */
      "FLAG_PN" = "🇵🇳",
      /**
       * Emoji: 🇧🇱
       */
      "FLAG_BL" = "🇧🇱",
      /**
       * Emoji: 🇵🇲
       */
      "FLAG_PM" = "🇵🇲",
      /**
       * Emoji: 🇬🇸
       */
      "FLAG_GS" = "🇬🇸",
      /**
       * Emoji: 🇹🇰
       */
      "FLAG_TK" = "🇹🇰",
      /**
       * Emoji: 🇧🇻
       */
      "FLAG_BV" = "🇧🇻",
      /**
       * Emoji: 🇭🇲
       */
      "FLAG_HM" = "🇭🇲",
      /**
       * Emoji: 🇸🇯
       */
      "FLAG_SJ" = "🇸🇯",
      /**
       * Emoji: 🇺🇲
       */
      "FLAG_UM" = "🇺🇲",
      /**
       * Emoji: 🇮🇨
       */
      "FLAG_IC" = "🇮🇨",
      /**
       * Emoji: 🇪🇦
       */
      "FLAG_EA" = "🇪🇦",
      /**
       * Emoji: 🇨🇵
       */
      "FLAG_CP" = "🇨🇵",
      /**
       * Emoji: 🇩🇬
       */
      "FLAG_DG" = "🇩🇬",
      /**
       * Emoji: 🇦🇸
       */
      "FLAG_AS" = "🇦🇸",
      /**
       * Emoji: 🇦🇶
       */
      "FLAG_AQ" = "🇦🇶",
      /**
       * Emoji: 🇻🇬
       */
      "FLAG_VG" = "🇻🇬",
      /**
       * Emoji: 🇨🇰
       */
      "FLAG_CK" = "🇨🇰",
      /**
       * Emoji: 🇨🇼
       */
      "FLAG_CW" = "🇨🇼",
      /**
       * Emoji: 🇪🇺
       */
      "FLAG_EU" = "🇪🇺",
      /**
       * Emoji: 🇬🇫
       */
      "FLAG_GF" = "🇬🇫",
      /**
       * Emoji: 🇹🇫
       */
      "FLAG_TF" = "🇹🇫",
      /**
       * Emoji: 🇬🇵
       */
      "FLAG_GP" = "🇬🇵",
      /**
       * Emoji: 🇲🇶
       */
      "FLAG_MQ" = "🇲🇶",
      /**
       * Emoji: 🇲🇵
       */
      "FLAG_MP" = "🇲🇵",
      /**
       * Emoji: 🇸🇽
       */
      "FLAG_SX" = "🇸🇽",
      /**
       * Emoji: 🇸🇸
       */
      "FLAG_SS" = "🇸🇸",
      /**
       * Emoji: 🇹🇨
       */
      "FLAG_TC" = "🇹🇨",
      /**
       * Emoji: 🇲🇫
       */
      "FLAG_MF" = "🇲🇫",
      /**
       * Emoji: 🇺🇳
       *
       * Aliases: `FLAG_UN`
       */
      "UNITED_NATIONS" = "🇺🇳",
      /**
       * Emoji: 🇺🇳
       *
       * Aliases: `UNITED_NATIONS`
       */
      "FLAG_UN" = "🇺🇳",
    }
  }
}
