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
       * Sets a new guild icon. Accepts image data in the format of JPEG, PNG, or GIF.
       *
       * If a string is passed, please pass a base64 encoded data URI.
       *
       * If null, the icon is removed.
       */
      icon?: ArrayBuffer | string | null;
      /**
       * The id of a user to transfer this guild to. Typically, bots will not be the owner of a guild.
       */
      ownerId?: Snowflake;
      /**
       * Sets a new guild invite page background/splash image. Requires the [[discord.Guild.Feature.INVITE_SPLASH]] feature on the guild.
       *
       * Accepts image data in the format of JPEG only.
       *
       * If a string is passed, please pass a base64 encoded data URI.
       *
       * If null, the invite background splash image is removed.
       */
      splash?: ArrayBuffer | string | null;
      /**
       * Sets a new guild invite page background. Requires the [[discord.Guild.Feature.BANNER]] feature on the guild.
       *
       * Accepts image data in the format of JPEG only.
       *
       * If a string is passed, please pass a base64 encoded data URI.
       *
       * If null, the banner is removed.
       */
      banner?: ArrayBuffer | string | null;
      /**
       * Sets the id of the [[discord.GuildTextChannel]] to send welcome messages and server boost messages to.
       *
       * If null, the feature is disabled.
       */
      systemChannelId?: Snowflake | null;
    }

    /**
     * A set of options to use when requesting members with [[discord.Guild.iterMembers]].
     */
    interface IIterMembersOptions {
      /**
       * The maximum amount of members to return.
       *
       * Setting this to a 0/undefined value will return all the members.
       */
      limit?: number;
      /**
       * The user id (or time, encoded as a snowflake) to start the scan from. Results from [[discord.Guild.iterMembers]] are returned by id in ascending order.
       */
      after?: Snowflake;
    }

    /**
     * A set of options to use when requesting audit log entries with [[discord.Guild.iterAuditLogs]].
     */
    interface IIterAuditLogsOptions {
      /**
       * The maximum amount of entries to return with this call.
       *
       * Note: If the requested limit is greater than 500, the function will throw an exception.
       */
      limit?: number;
      /**
       * The audit log entry id (or time, encoded as a snowflake) to start the scan from.
       *
       * Results from [[discord.Guild.iterAuditLogs]] are returned by id in descending order (by time).
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

    type IterAuditLogsOptionsWithActionType<
      T extends discord.AuditLogEntry.ActionType | undefined
    > = Guild.IIterAuditLogsOptions & {
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
     * An object used in an array in [[discord.Guild.editRolePositions]]
     */
    interface IRolePositionOptions {
      /**
       * The snowflake id of a [[discord.Role]] in the guild to modify.
       */
      id: discord.Snowflake;
      /**
       * The new position for the role in the guild.
       */
      position?: number;
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
       * A feature flag set when the guild admins have set to a Community server.
       *
       * When this flag is enabled, the welcome screen, membership screening, discovery, and the ability to receive community updates are unlocked.
       */
      COMMUNITY = "COMMUNITY",
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
      /**
       * A feature flag set when the guild admins have enabled the guild welcome screen.
       */
      WELCOME_SCREEN_ENABLED = "WELCOME_SCREEN_ENABLED",
      /**
       * A feature flag set when the guild admins have enabled membership screening.
       */
      MEMBER_VERIFICATION_GATE_ENABLED = "MEMBER_VERIFICATION_GATE_ENABLED",
      /**
       * A feature flag set when the guild may be previewed before joining via membership screening or the server directory.
       */
      PREVIEW_ENABLED = "PREVIEW_ENABLED",
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

    /**
     * A bot's guild-based voice state can be updated with the following options. Used with [[discord.Guild.setOwnVoiceState]].
     */
    interface ISetVoiceStateOptions {
      /**
       * This field determines the channel id for the current user's voice connection.
       *
       * If set to a valid channel id within the guild, the bot will connect to it.
       * If a new voice session was created, a VOICE_SERVER_UPDATE event will be received with the voice server's connection details.
       *
       * If set to null, the bot user will disconnect it's voice session.
       */
      channelId: Snowflake | null;
      /**
       * Set to `true` if the bot user should be self-muted upon joining the channel.
       *
       * Muted means the bot user will not be able to broadcast audio.
       *
       * Default: `false`
       */
      selfMute?: boolean;
      /**
       * Set to `true` if the bot user should be self-deafened upon joining the channel.
       *
       * Deafened means the bot user will not receive any audio.
       *
       * Default: `false`
       */
      selfDeaf?: boolean;
    }

    /**
     * Options for iterating over voice states in a guild with [[discord.Guild.iterVoiceStates]].
     */
    interface IIterVoiceStatesOptions {
      /**
       * If supplied, voice states will only be returned if they match the channel id.
       */
      channelId?: Snowflake;
    }

    /**
     * Options to specify during the creation of a guild emoji with [[discord.Guild.createEmoji]].
     */
    interface ICreateEmojiOptions {
      /**
       * The name of the emoji, can only contain alpha-numeric characters including dashes and underscores.
       */
      name: string;
      /**
       * The image data for this emoji, can be an ArrayBuffer containing JPEG, PNG, or GIF image data, or a "Data URI scheme" string (see https://discord.com/developers/docs/reference#image-data).
       *
       * The 'animated' flag will be interpreted by Discord based on the uploaded image data.
       *
       * Note: Emojis must be no more than 256kb.
       */
      image: ArrayBuffer | string;
      /**
       * An optional list of role ids that this emoji will be exclusive to.
       */
      roles?: Array<discord.Snowflake>;
    }

    /**
     * Options to pass when requesting a guild prune preview with [[discord.Guild.previewPrune]].
     */
    interface IPreviewPruneOptions {
      /**
       * The maximum number of days a member must be inactive for them to be considered for pruning.
       *
       * Acceptable values are 1 thru 30, and the default is 7 days.
       *
       * For example, if you choose 30, members who were active within the past 30 days will not be considered for pruning.
       */
      days?: number;
      /**
       * A list of roles to be included in the pruning process. By default, members with roles are ignored.
       * Specifying a role here will include members with only the roles specified for pruning.
       */
      includeRoles?: Array<discord.Snowflake>;
    }

    /**
     * Options to pass when executing a guild prune operation with [[discord.Guild.beginPrune]].
     */
    interface IPruneOptions {
      /**
       * The maximum number of days a member must be inactive for them to be considered for pruning.
       *
       * Acceptable values are 1 thru 30, and the default is 7 days.
       *
       * For example, if you choose 30, members who were active within the past 30 days will not be considered for pruning.
       */
      days?: number;
      /**
       * If set to false, the guild prune action will be scheduled and the call will return immediately.
       *
       * If true (default), the call will wait for the completion of the prune operation and return the total number of users pruned.
       */
      computePruneCount?: boolean;
      /**
       * A list of roles to be included in the pruning process. By default, members with roles are ignored.
       * Specifying a role here will include members with only the roles specified for pruning.
       */
      includeRoles?: Array<discord.Snowflake>;
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

    iterAuditLogs(
      options: Guild.IterAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.GUILD_UPDATE>
    ): AsyncIterableIterator<discord.AuditLogEntry.GuildUpdate>;
    iterAuditLogs(
      options: Guild.IterAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.CHANNEL_CREATE>
    ): AsyncIterableIterator<discord.AuditLogEntry.ChannelCreate>;
    iterAuditLogs(
      options: Guild.IterAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.CHANNEL_UPDATE>
    ): AsyncIterableIterator<discord.AuditLogEntry.ChannelUpdate>;
    iterAuditLogs(
      options: Guild.IterAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.CHANNEL_DELETE>
    ): AsyncIterableIterator<discord.AuditLogEntry.ChannelDelete>;
    iterAuditLogs(
      options: Guild.IterAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.CHANNEL_OVERWRITE_CREATE>
    ): AsyncIterableIterator<discord.AuditLogEntry.ChannelPermissionOverwriteCreate>;
    iterAuditLogs(
      options: Guild.IterAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.CHANNEL_OVERWRITE_UPDATE>
    ): AsyncIterableIterator<discord.AuditLogEntry.ChannelPermissionOverwritesUpdate>;
    iterAuditLogs(
      options: Guild.IterAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.CHANNEL_OVERWRITE_DELETE>
    ): AsyncIterableIterator<discord.AuditLogEntry.ChannelPermissionOverwriteDelete>;
    iterAuditLogs(
      options: Guild.IterAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.MEMBER_KICK>
    ): AsyncIterableIterator<discord.AuditLogEntry.MemberKick>;
    iterAuditLogs(
      options: Guild.IterAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.MEMBER_PRUNE>
    ): AsyncIterableIterator<discord.AuditLogEntry.MemberPrune>;
    iterAuditLogs(
      options: Guild.IterAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.MEMBER_BAN_ADD>
    ): AsyncIterableIterator<discord.AuditLogEntry.MemberBanAdd>;
    iterAuditLogs(
      options: Guild.IterAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.MEMBER_BAN_REMOVE>
    ): AsyncIterableIterator<discord.AuditLogEntry.MemberBanRemove>;
    iterAuditLogs(
      options: Guild.IterAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.MEMBER_UPDATE>
    ): AsyncIterableIterator<discord.AuditLogEntry.MemberUpdate>;
    iterAuditLogs(
      options: Guild.IterAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.MEMBER_ROLE_UPDATE>
    ): AsyncIterableIterator<discord.AuditLogEntry.MemberRoleUpdate>;
    iterAuditLogs(
      options: Guild.IterAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.MEMBER_MOVE>
    ): AsyncIterableIterator<discord.AuditLogEntry.MemberMove>;
    iterAuditLogs(
      options: Guild.IterAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.MEMBER_DISCONNECT>
    ): AsyncIterableIterator<discord.AuditLogEntry.MemberDisconnect>;
    iterAuditLogs(
      options: Guild.IterAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.BOT_ADD>
    ): AsyncIterableIterator<discord.AuditLogEntry.BotAdd>;
    iterAuditLogs(
      options: Guild.IterAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.ROLE_CREATE>
    ): AsyncIterableIterator<discord.AuditLogEntry.RoleCreate>;
    iterAuditLogs(
      options: Guild.IterAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.ROLE_UPDATE>
    ): AsyncIterableIterator<discord.AuditLogEntry.RoleUpdate>;
    iterAuditLogs(
      options: Guild.IterAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.ROLE_DELETE>
    ): AsyncIterableIterator<discord.AuditLogEntry.RoleDelete>;
    iterAuditLogs(
      options: Guild.IterAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.INVITE_CREATE>
    ): AsyncIterableIterator<discord.AuditLogEntry.InviteCreate>;
    iterAuditLogs(
      options: Guild.IterAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.INVITE_UPDATE>
    ): AsyncIterableIterator<discord.AuditLogEntry.InviteUpdate>;
    iterAuditLogs(
      options: Guild.IterAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.INVITE_DELETE>
    ): AsyncIterableIterator<discord.AuditLogEntry.InviteDelete>;
    iterAuditLogs(
      options: Guild.IterAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.WEBHOOK_CREATE>
    ): AsyncIterableIterator<discord.AuditLogEntry.WebhookCreate>;
    iterAuditLogs(
      options: Guild.IterAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.WEBHOOK_UPDATE>
    ): AsyncIterableIterator<discord.AuditLogEntry.WebhookUpdate>;
    iterAuditLogs(
      options: Guild.IterAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.WEBHOOK_DELETE>
    ): AsyncIterableIterator<discord.AuditLogEntry.WebhookDelete>;
    iterAuditLogs(
      options: Guild.IterAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.EMOJI_CREATE>
    ): AsyncIterableIterator<discord.AuditLogEntry.EmojiCreate>;
    iterAuditLogs(
      options: Guild.IterAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.EMOJI_UPDATE>
    ): AsyncIterableIterator<discord.AuditLogEntry.EmojiUpdate>;
    iterAuditLogs(
      options: Guild.IterAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.EMOJI_DELETE>
    ): AsyncIterableIterator<discord.AuditLogEntry.EmojiDelete>;
    iterAuditLogs(
      options: Guild.IterAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.MESSAGE_DELETE>
    ): AsyncIterableIterator<discord.AuditLogEntry.MessageDelete>;
    iterAuditLogs(
      options: Guild.IterAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.MESSAGE_BULK_DELETE>
    ): AsyncIterableIterator<discord.AuditLogEntry.MessageBulkDelete>;
    iterAuditLogs(
      options: Guild.IterAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.MESSAGE_PIN>
    ): AsyncIterableIterator<discord.AuditLogEntry.MessagePin>;
    iterAuditLogs(
      options: Guild.IterAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.MESSAGE_UNPIN>
    ): AsyncIterableIterator<discord.AuditLogEntry.MessageUnpin>;
    iterAuditLogs(
      options: Guild.IterAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.INTEGRATION_CREATE>
    ): AsyncIterableIterator<discord.AuditLogEntry.IntegrationCreate>;
    iterAuditLogs(
      options: Guild.IterAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.INTEGRATION_UPDATE>
    ): AsyncIterableIterator<discord.AuditLogEntry.IntegrationUpdate>;
    iterAuditLogs(
      options: Guild.IterAuditLogsOptionsWithActionType<AuditLogEntry.ActionType.INTEGRATION_DELETE>
    ): AsyncIterableIterator<discord.AuditLogEntry.IntegrationDelete>;
    iterAuditLogs(
      options?: Guild.IIterAuditLogsOptions
    ): AsyncIterableIterator<discord.AuditLogEntry.AnyAction>;

    /**
     * @deprecated Use [[discord.Guild.iterAuditLogs]]
     */
    getAuditLogs(
      options?: Guild.IIterAuditLogsOptions
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
     * Fetches an array of all [[discord.GuildInvite]] objects associated with this guild.
     */
    getInvites(): Promise<discord.GuildInvite[]>;

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
     * Fetches an array of [[discord.GuildBan]] objects that exist on the guild.
     */
    getBans(): Promise<GuildBan[]>;

    /**
     * Fetches a [[discord.GuildBan]] given a user id.
     *
     * @returns Resolves with a [[discord.GuildBan]] if found, otherwise `null`.
     */
    getBan(user: Snowflake | User): Promise<GuildBan | null>;

    /**
     * Un-bans or otherwise removes a ban for a specific user from the guild.
     *
     * @param user The user id or user-like object to un-ban.
     */
    deleteBan(user: Snowflake | User | GuildMember): Promise<void>;

    /**
     * Creates a role on the guild.
     *
     * If an error occurs, a [[discord.ApiError]] is thrown.
     *
     * @param options Settings for the new guild role. All fields are optional.
     */
    createRole(options: discord.Role.IRoleOptions): Promise<discord.Role>;

    /**
     * Modifies the role positioning for the set of roles sent in the `options` param.
     *
     * Role positions are important for role hoisting and permission inheritance.
     *
     * On success, the Promise resolves an array of all guild role objects.
     */
    editRolePositions(rolePositions: Array<discord.Guild.IRolePositionOptions>): Promise<Role[]>;

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
     * for await (const member of guild.iterMembers()) {
     *   await member.removeRole(SOME_ROLE_ID);
     * }
     * ```
     *
     * @param options Options for the request. All values are optional.
     */
    iterMembers(options?: Guild.IIterMembersOptions): AsyncIterableIterator<GuildMember>;

    /**
     * @deprecated Use [[discord.Guild.iterMembers]]
     */
    getMembers(options?: Guild.IIterMembersOptions): AsyncIterableIterator<GuildMember>;

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
     * Attempts to create a new emoji with the values provided. Returns the new emoji upon success.
     *
     * Note: Emojis may be a maximum size of 256kb.
     *
     * @param options The options to use when creating the new guild emoji.
     */
    createEmoji(options: discord.Guild.ICreateEmojiOptions): Promise<discord.Emoji>;

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
     * Sets and overwrites the bot's voice state within the guild.
     *
     * Using the required `channelId` option, you may connect to a voice or disconnect from a voice channel.
     * If you want to move channels, specify a new channel id.
     *
     * Disconnect the bot from it's voice session by setting `channelId` to `null`.
     *
     * This usually triggers a VOICE_SERVER_UPDATE and/or VOICE_STATE_UPDATE events.
     * Information from these events can be used to externally orchestrate voice protocol sockets.
     *
     * @param options the new voice state data. overriding any previously-set data.
     */
    setOwnVoiceState(options: discord.Guild.ISetVoiceStateOptions): Promise<void>;

    /**
     * A convenience method to get the bot's voice state for the guild.
     *
     * Returns null if the bot doesn't have a voice state set.
     */
    getOwnVoiceState(): Promise<discord.VoiceState | null>;

    /**
     * Get a member's voice state. Resolves as `null` if the member is not connected to a voice channel.
     *
     * @param userId the user to look up
     */
    getVoiceState(userId: discord.Snowflake): Promise<discord.VoiceState | null>;

    /**
     * Returns an async iterator over users connected to voice channels in this guild.
     *
     * You may optionally filter the results by channel, if a channelId is provided with the options object.
     *
     * @param options options for this query
     */
    iterVoiceStates(
      options?: discord.Guild.IIterVoiceStatesOptions
    ): AsyncIterableIterator<discord.VoiceState>;

    /**
     * Returns the number of users that **would be** removed/kicked from the guild in a prune operation.
     *
     * By default, prune will not remove users with roles. You can optionally include specific roles in your prune by providing the `includeRoles` option.
     * Any inactive user that has a subset of the provided role(s) will be counted in the prune and users with additional roles will not.
     *
     * Note: This is a costly operation, and should not be run too frequently.
     */
    previewPrune(options?: discord.Guild.IPreviewPruneOptions): Promise<number>;

    /**
     * Begins a prune operation with the given settings.
     * It is *highly recommend* to verify the number of users being pruned is accurate using [[discord.Guild.previewPrune]].
     *
     * By default, prune will not remove users with roles. You can optionally include specific roles in your prune by providing the includeRoles option.
     * Any inactive user that has a subset of the provided role(s) will be counted in the prune and users with additional roles will not.
     *
     * If the `computePruneCount` option is set to true (default), the returned value will be the number of users pruned.
     * In large guilds, it is recommended to set this to false as it may time out the operation on Discord's end.
     *
     * Note: This is a costly operation, and should not be run too frequently.
     */
    beginPrune(options?: discord.Guild.IPruneOptions): Promise<number>;
    beginPrune(options: discord.Guild.IPruneOptions & { computePruneCount: false }): Promise<void>;
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
     * Returns the latest [[discord.Presence]] data for this member.
     *
     * The presence object contains their online/offline status, custom status, and other real-time activity data.
     */
    getPresence(): Promise<discord.Presence>;

    /**
     * Returns a mention string in the format of `<@!id>` where id is the id of this user.
     */
    toMention(): string;
  }

  /**
   * An object containing data about a user's presence in a guild.
   */
  namespace Presence {
    /**
     * An enumeration of possible statuses a user can be in.
     *
     * The default state for a presence (if unknown) is `OFFLINE`.
     */
    const enum Status {
      /**
       * Online (green)
       */
      ONLINE = "online",
      /**
       * Idle, or Away (yellow)
       */
      IDLE = "idle",
      /**
       * Do not Disturb (red)
       */
      DND = "dnd",
      /**
       * Offline/Invisible (grey)
       */
      OFFLINE = "offline",
    }

    /**
     * An enumeration of possible activity types.
     *
     * The type denotes what will show under the username in the member list and other UI elements on the Discord client.
     */
    const enum ActivityType {
      /**
       * Example: `Playing {name}`
       */
      GAME = 0,
      /**
       * Example: `Streaming {name}`
       */
      STREAMING = 1,
      /**
       * Example: `Listening to {name}`
       */
      LISTENING = 2,
      /**
       * Example: `Watching {name}`
       */
      WATCHING = 3,
      /**
       * Custom Status
       *
       * Example: `{emoji} {name}`
       */
      CUSTOM = 4,
    }

    /**
     * An object containing start and end time for this activity.
     */
    interface IActivityTimestamps {
      /**
       * The unix-epoch timestamp (in milliseconds) when this activity started (if any).
       */
      start: Date | null;
      /**
       * The unix-epoch timestamp (in milliseconds) when this activity ends (if any).
       */
      end: Date | null;
    }

    /**
     * An object describing an emoji attached to an activity. Used for Custom Statuses.
     */
    interface IActivityEmoji {
      /**
       * The name of the emoji.
       *
       * If the emoji is a custom guild emoji, the name will be the text name set by the guild managers.
       *
       * Otherwise, the emoji will be the literal unicode surrogate for the emoji.
       */
      name: string;
      /**
       * If the emoji is a custom guild emoji, the id of the emoji.
       *
       * If the emoji is a unicode emoji, this property is null.
       */
      id: discord.Snowflake | null;
      /**
       * `true` if this emoji is animated. Only possible for custom guild emojis.
       */
      animated: boolean;
    }

    /**
     * Information describing an activity party.
     *
     * Parties cannot be joined by bots.
     */
    interface IActivityParty {
      /**
       * A unique identifier for this party. It is not necessarily snowflake.
       */
      id: string | null;
      /**
       * The current number of users in the party.
       */
      currentSize: number;
      /**
       * The maximum number of users that can join the party.
       */
      maxSize: number;
    }

    /**
     * An object containing any relevant image urls used for Rich Presence popups.
     */
    interface IActivityAssets {
      largeImage: string | null;
      largeText: string | null;
      smallImage: string | null;
      smallText: string | null;
    }

    /**
     * An object containing secrets for Rich Presence joining and spectating.
     */
    interface IActivitySecrets {
      join: string | null;
      spectate: string | null;
      match: string | null;
    }

    /**
     * A bit set of flags that describe what Rich Presence actions can be performed on an activity.
     */
    const enum ActivityFlags {
      NONE = 0,
      INSTANCE = 1,
      JOIN = 1 << 1,
      SPECTATE = 1 << 2,
      JOIN_REQUEST = 1 << 3,
      SYNC = 1 << 4,
      PLAY = 1 << 5,
    }

    /**
     * An object describing an ongoing activity.
     *
     * This data is usually used to display the "Currently Playing" data on the user card in the Discord client.
     *
     * It also contains any other relevant Rich Presence data, if any exists.
     *
     * All fields are nullable except the name and type.
     */
    interface IActivity {
      /**
       * The name of the game or activity.
       */
      readonly name: string;
      /**
       * The type of activity this is.
       */
      readonly type: Presence.ActivityType;
      /**
       * A url for this activity, typically a url to a stream if the activity is a STREAMING.
       */
      readonly url: string | null;
      /**
       * The date this activity started.
       */
      readonly createdAt: Date | null;
      /**
       * An object containing start and end time for this activity.
       */
      readonly timestamps: Presence.IActivityTimestamps | null;
      /**
       * The application id (game id) this activity is associated with.
       */
      readonly applicationId: Snowflake | null;
      /**
       * What the player is currently doing.
       */
      readonly details: string | null;
      /**
       * The user's current party status.
       */
      readonly state: string | null;
      /**
       * The data for the Emoji used for the user's custom status, if set.
       */
      readonly emoji: Presence.IActivityEmoji | null;
      /**
       * The activity's party information.
       */
      readonly party: Presence.IActivityParty | null;
      /**
       * An object containing any relevant image urls used for Rich Presence popups.
       */
      readonly assets: Presence.IActivityAssets | null;
      /**
       * An object containing secrets for Rich Presence joining and spectating.
       */
      readonly secrets: Presence.IActivitySecrets | null;
      /**
       * `true` if the activity is an instanced game session.
       */
      readonly instance: boolean;
      /**
       * A bit set of flags that describe what Rich Presence actions can be performed on this activity.
       */
      readonly flags: Presence.ActivityFlags | null;
    }

    /**
     * An object containing a potential status set for each device type a user may be using.
     */
    interface IClientStatus {
      desktop: discord.Presence.ActivityType | null;
      mobile: discord.Presence.ActivityType | null;
      web: discord.Presence.ActivityType | null;
    }
  }

  /**
   * An object containing data about a user's presence in a guild.
   */
  class Presence {
    /**
     * The id of the user for the presence data
     */
    readonly userId: Snowflake;
    /**
     * The id of the guild this presence data exists for.
     */
    readonly guildId: Snowflake;
    /**
     * The current online/idle/dnd/offline status for the user.
     */
    readonly status: Presence.Status;
    /**
     * An array of activities included in the presence, if any.
     *
     * Activities describe games being played, custom statuses, rich-presence, and other integrations like listen-along.
     */
    readonly activities: Array<Presence.IActivity>;
    /**
     * An object containing a potential status set for each device type a user may be using.
     */
    readonly clientStatus: Presence.IClientStatus;
  }

  /**
   * An object that represents a ban on a guild.
   *
   * Note: If you need to ban a member or create a new ban, use [[discord.Guild.createBan]].
   */
  class GuildBan {
    /**
     * The id of the guild this ban belongs to.
     */
    readonly guildId: discord.Snowflake;
    /**
     * The user banned from the guild.
     */
    readonly user: discord.User;
    /**
     * A user-provided reason for the ban. If no reason was provided, the value will be `""`, an empty string.
     */
    readonly reason: string;

    /**
     * Retrieves the [[discord.Guild]] associated with this ban.
     *
     * If you only need the guild id, it's provided via the `guildId` property.
     */
    getGuild(): Promise<discord.Guild>;

    /**
     * Deletes the guild ban and un-bans the associated user from the guild.
     */
    delete(): Promise<void>;
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
      | GuildStoreChannel
      | GuildStageVoiceChannel;

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
      ROLE = 0,
      MEMBER = 1,
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
      /**
       * A special guild voice channel for Community servers.
       *
       * In these channels, audience members can listen to users elected to the stage by moderators.
       *
       * Note: See [[discord.GuildStageVoiceChannel]].
       */
      GUILD_STAGE_VOICE = 13,
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
     * The type of this channel. See [[discord.Channel.AnyGuildChannel]] for a complete list of guild channel types.
     */
    readonly type:
      | Channel.Type.GUILD_CATEGORY
      | Channel.Type.GUILD_TEXT
      | Channel.Type.GUILD_NEWS
      | Channel.Type.GUILD_STORE
      | Channel.Type.GUILD_VOICE
      | Channel.Type.GUILD_STAGE_VOICE;

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
     * Creates an invite for the channel. All properties of the `options` parameter are optional.
     *
     * @param options The settings to use for this invite. All parameters are optional.
     */
    createInvite(options?: discord.Invite.ICreateInviteOptions): Promise<discord.GuildInvite>;

    /**
     * Fetches an array of [[discord.GuildInvite]] objects associated with this channel.
     */
    getInvites(): Promise<discord.GuildInvite[]>;

    /**
     * Fetches the data for the guild this channel belongs to.
     */
    getGuild(): Promise<discord.Guild>;

    /**
     * Returns the calculated member permissions for this channel.
     *
     * It is calculated off the base member permissions via [[discord.GuildMember.permissions]] and the member and role-specific permission overwrites from [[discord.GuildChannel.permissionOverwrites]].
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
     * Permissions are calculated off the base member permissions via [[discord.GuildMember.permissions]] and the member and role-specific permission overwrites from [[discord.GuildChannel.permissionOverwrites]].
     *
     * @param member The GuildMember you want to calculate channel-specific permissions for.
     * @param permission The permission you are checking for. Check [[discord.Permissions]] for an exhaustive list of all permissions.
     * @returns `true` if the permission is granted, otherwise `false`.
     */
    canMember(member: GuildMember, permission: Permissions): boolean;

    /**
     * Returns the calculated role permissions for this channel.
     *
     * The permissions are calculated by finding the role in [[discord.GuildChannel.permissionOverwrites]] and applying on top of the everyone role permissions for the channel.
     *
     * Note: If you just want to see if a role has a permission, use [[discord.GuildChannel.canRole]].
     *
     * @param role The Role you want to calculate channel-specific permissions for.
     * @returns The permission bit set calculated for the given role.
     */
    getRolePermissions(role: Role): number;

    /**
     * Determines if a role can perform actions that require the permission specified in this channel.
     *
     * The permissions are calculated by finding the role in [[discord.GuildChannel.permissionOverwrites]] and applying on top of the everyone role permissions for the channel.
     *
     * @param role The Role you want to calculate channel-specific permissions for.
     * @param permission The permission you are checking for. Check [[discord.Permissions]] for an exhaustive list of all permissions.
     * @returns `true` if the permission is granted, otherwise `false`.
     */
    canRole(role: Role, permission: Permissions): boolean;

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
     * Creates an invite for the channel. All properties of the `options` parameter are optional.
     *
     * @param options The settings to use for this invite. All parameters are optional.
     */
    createInvite(
      options?: discord.Invite.ICreateVoiceChannelInviteOptions
    ): Promise<discord.GuildInvite>;

    /**
     * Attempts to delete the channel.
     *
     * If an error occurs, a [[discord.ApiError]] exception is thrown.
     */
    delete(): Promise<void>;
  }

  namespace GuildStageVoiceChannel {
    interface IGuildStageVoiceChannelOptions extends GuildChannel.IGuildChannelOptions {}
  }

  /**
   * A special [[discord.Guild]] voice channel for Community servers.
   *
   * In these channels, audience members can listen to users elected to the stage by moderators.
   */
  class GuildStageVoiceChannel extends GuildChannel {
    /**
     * The current topic set by Stage moderators for the session.
     *
     * May be changed by anyone with MANAGE_CHANNEL permissions.
     */
    readonly topic: string | null;

    /**
     * The bitrate of voice data for this channel.
     *
     * Stage Voice channels currently default to 40kbps (40000 bytes per second).
     */
    readonly bitrate: number;

    /**
     * Limits the number of users that can be active in the voice channel at once.
     *
     * Stage Voice channels currently default to 1000 maximum mebers.
     */
    readonly userLimit: number;

    /**
     * The type of this channel. Always [[Channel.Type.GUILD_STAGE_VOICE]].
     */
    readonly type: Channel.Type.GUILD_STAGE_VOICE;

    /**
     * Attempts to update the given options for this channel.
     *
     * If an error occurs, a [[discord.ApiError]] will be thrown.
     *
     * @param updateData The settings to update for this channel.
     */
    edit(
      updateData: GuildStageVoiceChannel.IGuildStageVoiceChannelOptions
    ): Promise<GuildStageVoiceChannel>;

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

    /**
     * Attempts to publish a message in the announcements channel.
     *
     * If an error occurs, a [[discord.ApiError]] exception will be thrown.
     */
    publishMessage(messageId: discord.Snowflake | discord.Message): Promise<discord.Message>;
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
     * A basic emoji descriptor.
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

    /**
     * Valid options to pass when modifying an existing guild emoji.
     */
    interface IEditEmojiOptions {
      /**
       * If included, will update the name of this emoji. Emoji names must be alpha-numeric (including dashes and underscores).
       */
      name?: string;
      /**
       * If included, updates the role access list for this emoji.
       *
       * If set to null, the access list will be removed and the emoji will be available to everyone in the guild.
       */
      roles?: Array<Snowflake> | null;
    }
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
    readonly roles: Array<Snowflake>;
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

    /**
     * Deletes the emoji from this guild.
     */
    delete(): Promise<void>;

    /**
     * Edits the emoji's options. You can't change the emoji's image, but the name and role list may be updated.
     *
     * Returns the new emoji data on success.
     */
    edit(options: discord.Emoji.IEditEmojiOptions): Promise<Emoji>;
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
      CHANNEL_PINNED_MESSAGE = 6,
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
      /**
       * A default message that includes a reference to a message.
       */
      REPLY = 19,
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
     * Describes outgoing attachment data.
     */
    interface IOutgoingMessageAttachment {
      /**
       * The name of the file, this is required.
       *
       * Example: `image.png`
       */
      name: string;
      /**
       * The contents of the file, in binary format.
       */
      data: ArrayBuffer;
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
      /**
       * If set, will attempt to upload entries as file attachments to the message.
       */
      attachments?: Array<IOutgoingMessageAttachment>;
      /**
       * When this is set, the message will attempt to become an inline reply of the provided message reference.
       *
       * The message or snowflake set here must reference a message inside the channel being sent to, otherwise an error will be thrown.
       *
       * You can configure wether the author of the message referenced here gets pinged by setting allowedMentions with repliedMessage set to false.
       *
       * Setting this on a [[discord.Message.inlineReply]] call overrides it. Conversely, setting it to `null` suppresses it.
       */
      reply?: Message | Snowflake | Message.IMessageReference;
    }

    /**
     * A type-alias used to describe the possible options for message content. See [[discord.Message.IOutgoingMessageOptions]] for a full list of options.
     */
    type OutgoingMessageOptions = IOutgoingMessageOptions &
      (
        | { content: string }
        | { embed: Embed }
        | { embed?: null; content: string }
        | { attachments: Array<IOutgoingMessageAttachment> }
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
      /**
       * If set to true, this message will be allowed to ping the author of the referenced message for inline replies.
       *
       * If this isn't set, this is inferred to be true.
       */
      reply?: boolean;
    }

    /**
     * Options specified when calling [[discord.Message.iterReactions]].
     */
    interface IIterReactionsOptions {
      /**
       * If specified, will fetch users with ids numerically greater than than the one specified.
       */
      after?: Snowflake;
      /**
       * Limits the number of total requests the iterator will generate.
       *
       * Defaults to `100`.
       */
      limit?: number;
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
    readonly author: User;
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
     * Does the same thing as .reply, but adds an inline reply referencing this message.
     *
     * If reply is set on the settings resolved by outgoingMessageOptions, then that will override the inline reply set by this function.
     *
     * @param outgoingMessageOptions Outgoing message options.
     */
    inlineReply(
      outgoingMessageOptions: Message.OutgoingMessageArgument<Message.OutgoingMessageOptions>
    ): Promise<Message>;
    /**
     * Does the same thing as .reply, but adds an inline reply referencing this message.
     *
     * @param content Content to use for the outgoing message.
     */
    inlineReply(content: Message.OutgoingMessageArgument<string>): Promise<Message>;
    /**
     * Does the same thing as .reply, but adds an inline reply referencing this message.
     *
     * @param embed The embed object you'd like to send to the channel.
     */
    inlineReply(embed: Message.OutgoingMessageArgument<Embed>): Promise<Message>;

    /**
     * Attempts to permanently delete this message.
     *
     * If an error occurred, a [[discord.ApiError]] exception is thrown.
     */
    delete(): Promise<void>;

    /**
     * Provides an async iterator over a list of users that reacted to the message with the given emoji.
     */
    iterReactions(
      emoji: string,
      options?: Message.IIterReactionsOptions
    ): AsyncIterableIterator<User>;

    /**
     * Reacts to this message with the specified emoji.
     *
     * If an error occurred, a [[discord.ApiError]] exception is thrown.
     *
     * @param emoji If passing a string, use a raw unicode emoji like ✅, or a custom emoji in the format of `name:id`.
     */
    addReaction(emoji: string | discord.Emoji.IEmoji): Promise<void>;

    /**
     * Deletes the bot user's own reaction to this message of the specified emoji.
     *
     * If an error occurred, a [[discord.ApiError]] exception is thrown.
     *
     * @param emoji If passing a string, use a raw unicode emoji like ✅, or a custom emoji in the format of `name:id`.
     */
    deleteOwnReaction(emoji: string | discord.Emoji.IEmoji): Promise<void>;

    /**
     * Deletes a user's reaction to the message.
     *
     * If an error occurred, a [[discord.ApiError]] exception is thrown.
     *
     * @param emoji If passing a string, use a raw unicode emoji like ✅, or a custom emoji in the format of `name:id`.
     * @param user A user id or reference to a user object.
     */
    deleteReaction(
      emoji: string | discord.Emoji.IEmoji,
      user: discord.Snowflake | discord.User
    ): Promise<void>;

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
     * @param emoji If passing a string, use a raw unicode emoji like ✅, or a custom emoji in the format of `name:id`.
     */
    deleteAllReactionsForEmoji(emoji: string | discord.Emoji.IEmoji): Promise<void>;

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
      messageOptions: Pick<Message.OutgoingMessageOptions, "content" | "embed"> & { flags?: number }
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
     * Messages of this type are always [[Message.Type.DEFAULT]] or [[Message.Type.REPLY]].
     */
    readonly type: Message.Type.DEFAULT | Message.Type.REPLY;

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
    readonly code: Snowflake;
    /**
     * Partial guild data for this invite, if relevant.
     */
    readonly guild: Invite.GuildData | null;
    /**
     * Partial channel data for this invite.
     *
     * Users who use this invite will be redirected to the channel id.
     */
    readonly channel: Invite.ChannelData;
    /**
     * The user object who created this invite, if relevant.
     */
    readonly inviter: discord.User | null;
    /**
     * A user that the invite targets.
     *
     * Right now, this only indiicates if the invite is for a specific user's go-live stream in a guild's voice channel.
     */
    readonly targetUser: discord.User | null;
    /**
     * If `targetUser` is set, this property specifies the type of invite and user this targets.
     *
     * Right now, the only possible option is [[discord.Invite.TargetUserType.STREAM]].
     */
    readonly targetUserType: discord.Invite.TargetUserType.STREAM | null;
    /**
     * If the invite is for a guild, this includes an approximate count of members online in the guild.
     *
     * Requires that the invite was retrieved with [[discord.Invite.IGetGuildOptions.withCounts]] set to `true`.
     */
    readonly approximatePresenceCount: number | null;
    /**
     * If the invite is for a guild channel, this number is the approximate total member count for the guild.
     *
     * Requires that the invite was retrieved with [[discord.Invite.IGetGuildOptions.withCounts]] set to `true`.
     */
    readonly approximateMemberCount: number | null;

    /**
     * Returns a url for the invite, in the format: `https://discord.gg/<code>`.
     */
    getUrl(): string;

    /**
     * Attempts to retrieve the full Guild object for this invite, if set.
     *
     * This function will also return `null` if the channel does not belong to the guild the script is running in.
     */
    getGuild(): Promise<discord.Guild | null>;

    /**
     * Attempts to retrieve the full Channel object for this invite.
     *
     * This function will return `null` if the channel does not belong to the guild the script is running in.
     */
    getChannel(): Promise<discord.Channel.AnyGuildChannel | null>;

    /**
     * Tries to delete this invite. The bot user must be able to manage the channel or guild the invite belongs.
     *
     * If an error occurs, a [[discord.ApiError]] will be thrown.
     */
    delete(): Promise<void>;
  }

  /**
   * An object representing an invite on Discord for a channel in a [[discord.Guild]]. Extends [[discord.Invite]]
   */
  class GuildInvite extends Invite {
    /**
     * Partial data about the guild the invite originated from.
     */
    readonly guild: discord.Invite.GuildData;

    /**
     * Never set for a GuildInvite
     */
    readonly approximatePresenceCount: null;

    /**
     * Never set for a GuildInvite
     */
    readonly approximateMemberCount: null;

    /**
     * The number of times this invite has been used.
     */
    readonly uses: number;
    /**
     * The configured maximum amount of times the invite is used before the invite expires. `0` for no limit.
     */
    readonly maxUses: number;
    /**
     * The maximum duration (in seconds) after which the invite expires. `0` for never.
     */
    readonly maxAge: number;
    /**
     * If `true`, the invite only grants temporary membership to the guild. Default is `false`.
     */
    readonly temporary: boolean;
    /**
     * An ISO-8601 formatted timestamp string of when the invite was created.
     */
    readonly createdAt: string;

    /**
     * Attempts to retrieve the full Guild object for this invite.
     */
    getGuild(): Promise<discord.Guild>;

    /**
     * Attempts to retrieve the full Channel object for this invite.
     */
    getChannel(): Promise<discord.Channel.AnyGuildChannel>;
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
     * Options used when creating an invite, typically with [[discord.GuildChannel.createInvite]].
     */
    interface ICreateInviteOptions {
      /**
       * The lifetime of this invite, in seconds. `0` for never.
       *
       * Default: `86400` (24 hours)
       */
      maxAge?: number;
      /**
       * The maximum number of times this invite can be used before deleting itself.
       *
       * Default: `0` (unlimited)
       */
      maxUses?: number;
      /**
       * If `true`, this invite will allow for temporary membership to the guild.
       *
       * The user will be kicked from the guild if they go offline and haven't been given a role.
       *
       * Default: `false`
       */
      temporary?: boolean;
      /**
       * If `true`, the invite is guaranteed to be new and unique.
       *
       * Otherwise, a recently created similar invite may be returned.
       *
       * Default: `false`
       */
      unique?: boolean;
    }

    /**
     * Options used when creating an invite, typically with [[discord.GuildChannel.createInvite]].
     */
    interface ICreateVoiceChannelInviteOptions extends ICreateInviteOptions {
      /**
       * The target user id for this invite. The target user must be streaming video in a channel.
       *
       * The invite created will resolved specifically to the broadcast rather than just the voice channel.
       */
      targetUser?: discord.Snowflake;
      /**
       * Specifies the type of invite and user this targets.
       *
       *  Right now, the only possible option is [[discord.Invite.TargetUserType.STREAM]].
       */
      targetUserType?: discord.Invite.TargetUserType;
    }

    /**
     * An enumeration of possible sub-types the invite can specify. These invites will usually have a [[discord.Invite.targetUser]] set.
     */
    enum TargetUserType {
      /**
       * Used to indicate the invite is targetting a go-live or live video broadcast in a [[discord.GuildVoiceChannel]].
       *
       * The [[discord.Invite.targetUser]] will identify the user streaming.
       */
      STREAM = 1,
    }

    /**
     * Partial guild data present on some invite data.
     */
    type GuildData = {
      /**
       * The id of the [[discord.Guild]].
       */
      readonly id: Snowflake;
      /**
       * The name of the guild.
       */
      readonly name: string;
      /**
       * The splash image hash of the guild, if set.
       */
      readonly splash: string | null;
      /**
       * The icon of the guild, if set. See [[discord.Guild.icon]] for more info.
       */
      readonly icon: string | null;
      /**
       * A list of features available for this guild. See [[discord.Guild.features]] for more info.
       */
      readonly features: Array<discord.Guild.Feature>;
      /**
       * The level of user account verification required to send messages in this guild without a role.
       */
      readonly verificationLevel: discord.Guild.MFALevel;
      /**
       * The vanity url invite code for this guild, if set.
       */
      readonly vanityUrlCode: string | null;
    };

    /**
     * Partial channel data present on channel data.
     */
    type ChannelData = {
      /**
       * The id of the [[discord.Channel]] this data represents.
       */
      readonly id: Snowflake;
      /**
       * The name of the channel.
       */
      readonly name: string;
      /**
       * The type of channel the invite resolves to.
       */
      readonly type: Channel.Type;
    };
  }

  namespace VoiceState {
    /**
     * The options for a voice state.
     *
     * These are currently used for Guild Stage Voice channels. Behavior is *subject to change* as the new channel type evolves.
     */
    interface IVoiceStateEditOptions {
      /**
       * Set if the user is suppressed.
       */
      suppress?: boolean;
      /**
       * Set's the voice state's request to speak timestamp.
       *
       * If set to null, the request is removed.
       *
       * Note: Only valid for Guild Stage Voice channels.
       */
      requestToSpeakTimestamp?: string | null;
    }
  }

  /**
   * A class representing a user's voice state.
   */
  class VoiceState {
    /**
     * The guild id this voice state is targeting.
     */
    readonly guildId: Snowflake;
    /**
     * The id of the [[discord.GuildVoiceChannel]]. If `null`, it indicates the user has disconnected from voice.
     */
    readonly channelId: Snowflake | null;
    /**
     * The id of the [[discord.User]] this voice state applies to.
     */
    readonly userId: Snowflake;
    /**
     * A reference to the [[discord.GuildMember]] this voice state applies to.
     */
    readonly member: GuildMember;
    /**
     * The session id associated with this user's voice connection.
     */
    readonly sessionId?: string;
    /**
     * `true` if the user has been server-deafened.
     *
     * They will not be sent any voice data from other users if deafened.
     */
    readonly deaf: boolean;
    /**
     * `true` if the user has been server-muted.
     *
     * They will not transmit voice data if muted.
     */
    readonly mute: boolean;
    /**
     * `true if the user has opted to deafen themselves via the client.
     *
     * They will not receive or be sent any voice data from other users if deafened.
     */
    readonly selfDeaf: boolean;
    /**
     * `true` if the user has opted to mute their microphone via the client.
     *
     * They will not transmit voice audio if they are self-muted.
     */
    readonly selfMute: boolean;
    /**
     * `true` if the user is currently streaming to the channel using Go Live.
     */
    readonly selfStream: boolean;
    /**
     * `true` if the user's camera is enabled.
     */
    readonly selfVideo: boolean;
    /**
     * `true` if the user is muted by the current user.
     */
    readonly suppress: boolean;
    /**
     * The time at which the user requested to speak (used for GUILD_STAGE_VOICE channel hand-raising).
     *
     * Note: The timestamp is in ISO-8601 UTC format (`YYYY-MM-DDTHH:mm:ss`).
     */
    readonly requestToSpeakTimestamp: string | null;
    /**
     * Fetches data for the guild associated with this voice state.
     */
    getGuild(): Promise<discord.Guild>;
    /**
     * If `channelId` is not null, will fetch the channel data associated with this voice state.
     */
    getChannel(): Promise<discord.GuildVoiceChannel | discord.GuildStageVoiceChannel | null>;
    /**
     * Updates a voice state with the options provided. Only valid for voice states in Guild Stage Voice channels.
     */
    edit(options: discord.VoiceState.IVoiceStateEditOptions): Promise<void>;
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
       * The id of the [[discord.ITextChannel]] the messages were deleted from.
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
       * The id of the [[discord.ITextChannel]] the messages were deleted from.
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
       * The id of the [[discord.ITextChannel]] the message resides in.
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
       * The id of the [[discord.ITextChannel]] the message resides in.
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
       * The id of the [[discord.ITextChannel]] the message resides in.
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
       * The id of the [[discord.ITextChannel]] this event occurred in.
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
       * The id of the [[discord.ITextChannel]] this event occurred in.
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
       * The id of the [[discord.ITextChannel]] this event occurred in.
       */
      channelId: Snowflake;
      /**
       * The date and time a message was last pinned in ISO-8601 UTC format (`YYYY-MM-DDTHH:mm:ss`).
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
   * The [[discord.GuildBan]] event parameter will never contain a `reason` when received via the gateway.
   *
   * @event
   */
  function on(
    event: Event.GUILD_BAN_ADD | "GUILD_BAN_ADD",
    handler: (guildBan: Omit<GuildBan, "reason">) => Promise<unknown>
  ): void;

  /**
   * Fired when a [[discord.GuildMember]] is unbanned from a [[discord.Guild]].
   *
   * The [[discord.GuildBan]] event parameter will never contain a `reason` when received via the gateway.
   *
   * @event
   */
  function on(
    event: Event.GUILD_BAN_REMOVE | "GUILD_BAN_REMOVE",
    handler: (guildBan: Omit<GuildBan, "reason">) => Promise<unknown>
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
   * Returns the [[discord.Snowflake]] ID for the [[discord.Guild]] this script is active for.
   */
  function getGuildId(): discord.Snowflake;

  /**
   * Returns the [[discord.Snowflake]] ID for the current bot user the deployment is running for.
   */
  function getBotId(): discord.Snowflake;

  /**
   * Fetches a [[discord.User]] object containing information about the bot user the deployment is running for.
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
   * Fetches a [[discord.Guild]] object for the active deployment's guild.
   *
   * @param guildId The guild id (snowflake) you want to fetch guild data for.
   */
  function getGuild(guildId?: undefined): Promise<discord.Guild>;

  /**
   * Fetches a [[discord.Channel]] (or more specific child) object for a given Discord channel id.
   *
   * Note: You can only fetch channels for the guild your deployment is associated with.
   *
   * @param channelId The channel id (snowflake) you want to fetch channel data for.
   */
  function getChannel(channelId: discord.Snowflake): Promise<discord.Channel.AnyChannel | null>;

  /**
   * Fetches a [[discord.ITextChannel]] for a given Discord channel id.
   *
   * If the channel exists, but is not a text channel, function will return null.
   */
  function getTextChannel(channelId: discord.Snowflake): Promise<discord.ITextChannel | null>;

  /**
   * Fetches a [[discord.GuildTextChannel]] for a given Discord channel id.
   *
   * If the channel exists, but is not a guild text text channel, function will return null.
   */
  function getGuildTextChannel(
    channelId: discord.Snowflake
  ): Promise<discord.GuildTextChannel | null>;

  /**
   * Fetches a [[discord.GuildVoiceChannel]] for a given Discord channel id.
   *
   * If the channel exists, but is not a guild voice channel, function will return null.
   */
  function getGuildVoiceChannel(
    channelId: discord.Snowflake
  ): Promise<discord.GuildVoiceChannel | null>;

  /**
   * Fetches a [[discord.GuildStageVoiceChannel]] for a given Discord channel id.
   *
   * If the channel exists, but is not a guild stage voice channel, function will return null.
   */
  function getGuildStageVoiceChannel(
    channelId: discord.Snowflake
  ): Promise<discord.GuildStageVoiceChannel | null>;

  /**
   * Fetches a [[discord.GuildCategory]] for a given Discord channel id.
   *
   * If the channel exists, but is not a category channel, function will return null.
   */
  function getGuildCategory(channelId: discord.Snowflake): Promise<discord.GuildCategory | null>;

  /**
   * Fetches a [[discord.GuildNewsChannel]] for a given Discord channel id.
   *
   * If the channel exists, but is not a text channel, function will return null.
   */
  function getGuildNewsChannel(
    channelId: discord.Snowflake
  ): Promise<discord.GuildNewsChannel | null>;

  /**
   * ## Discord Interactions SDK
   *
   * This module contains sub-modules for each interaction type.
   *
   * Currently, you may only register slash commands.
   *
   * See [[discord.interactions.commands]] for  more information on slash commands.
   */
  namespace interactions {
    /**
     * ### Discord Slash Commands
     *
     * Slash commands offer a way to register commands with full auto-completion of options and discovery via the `/` menu.
     *
     * It's easy to register a slash command. Here's a quick example:
     *
     * ```ts
     * discord.interactions.commands.register({
     *   name: 'ping',
     *   description: 'Replies with Pong!'
     * }, async (interaction) => {
     *   await interaction.respond('Pong!');
     * });
     * ```
     *
     * Capturing command options, or arguments, is easy too. Here's an echo command example:
     *
     * ```ts
     * discord.interactions.commands.register({
     *   name: 'echo',
     *   description: 'Replies and echos the original input.',
     *   options: (opt) => ({
     *     input: opt.string('The text to echo.')
     *   })
     * }, async (interaction, { input }) => {
     *   await interaction.respond(`You said: ${input}`);
     * });
     * ```
     *
     * Commands options have some configuration options. You can choose to make them optional, and even provide a list of pre-defined choices to some types!
     *
     * See [[discord.interactions.commands.IOptionProviders]] for a list of option types and their configs.
     */
    namespace commands {
      /**
       * Information contained in a Slash Command interaction request from Discord.
       */
      class SlashCommandInteraction {
        /**
         * The unique ID for this interaction event.
         */
        readonly id: discord.Snowflake;
        /**
         * The ID of the guild this command occurred in.
         */
        readonly guildId: discord.Snowflake;
        /**
         * The ID of the channel this command occurred in.
         */
        readonly channelId: discord.Snowflake;
        /**
         * A reference to the member that performed the command.
         */
        readonly member: discord.GuildMember;

        readonly commandId: discord.Snowflake;
        readonly commandName: discord.Snowflake;

        /**
         * Retrieves the guild object for the guild this command was ran on.
         */
        getGuild(): Promise<discord.Guild>;

        /**
         * Retrieves the channel object for the channel this command was ran in.
         */
        getChannel(): Promise<discord.GuildChannel>;

        /**
         * Manually acknowledges an interaction, using the options passed in the first argument.
         *
         * Usually used in combination with [[ICommandConfig.ackBehavior]] set to MANUAL.
         *
         * @param options Options for this acknowledgement.
         */
        acknowledge(options: IAcknowledgeOptions): Promise<void>;
        /**
         * @deprecated Since the end of Discord's Slash Command Developer Beta (3/25/2021), source messages always show. Switch to passing [[IAcknowledgeOptions]] instead.
         */
        acknowledge(showSourceMessage: boolean): Promise<void>;

        /**
         * Responds with the given message contents/options.
         *
         * When successful this returns a `SlashCommandResponse` that you may edit or delete later.
         *
         * Note: You may respond to an interaction more than once.
         *
         * @param response A string or object with outgoing response data.
         */
        respond(response: string | IResponseMessageOptions): Promise<SlashCommandResponse>;

        /**
         * Responds with a message seen only by the invoker of the command.
         *
         * As a limitation of the Discord API, you may only send string-based content.
         *
         * Once sent, ephemeral replies may not be edited or deleted. As such, this function's return type is void.
         *
         * This is useful for instances where you don't need to announce the reply to all users in the channel.
         *
         * @param response The response to send to the user.
         */
        respondEphemeral(response: string): Promise<void>;

        /**
         * Edits the original response message, if sent.
         *
         * This function will error if called before acknowledging the command interaction.
         *
         * @param response A string or object with outgoing response data.
         */
        editOriginal(response: string | IResponseMessageOptions): Promise<void>;

        /**
         * Deletes the original response message, if sent.
         *
         * This function will error if called before acknowledging the command interaction.
         *
         * @param response A string or object with outgoing response data.
         */
        deleteOriginal(): Promise<void>;
      }

      /**
       * Possible options for a manual command interaction acknowledgement.
       */
      interface IAcknowledgeOptions {
        /**
         * If set to true, the bot will only show the command source and "thinking" animation to the user who executed the command.
         */
        ephemeral: boolean;
      }

      type OptionType =
        | string
        | number
        | boolean
        | discord.GuildMember
        | discord.GuildChannel
        | discord.Role
        | null;

      interface IOptionConfig {
        /**
         * 3-32 character command name. By default, the name is the key name in the arguments factory object.
         * If you want, you can override the name shown to the client with this.
         */
        name?: string;
        /**
         * A 1-100 character description.
         */
        description: string;
        /**
         * If `true`, this option will be the first option prompted by the client when filling out this command.
         *
         * Default: `false`.
         *
         * Only one option can be marked as the default.
         */
        default?: boolean;
        /**
         * If `false`, the option is optional and becomes nullable.
         *
         * Default: `true`.
         */
        required?: boolean;
      }

      interface IOptionChoice<T> {
        name: string;
        value: T;
      }

      interface IStringOptionConfig extends IOptionConfig {
        /**
         * An array of string choices, or choice objects with separate name and values.
         */
        choices?: Array<string | IOptionChoice<string>>;
      }

      interface IIntegerOptionConfig extends IOptionConfig {
        /**
         * An array of integer choices, or choice objects with separate name and values.
         */
        choices?: Array<number | IOptionChoice<number>>;
      }

      interface IOptionProviders {
        string(config: IStringOptionConfig & { required: false }): string | null;
        string(config: IStringOptionConfig): string;
        string(description: string): string;

        integer(config: IIntegerOptionConfig & { required: false }): number | null;
        integer(config: IIntegerOptionConfig): number;
        integer(description: string): number;

        boolean(config: IOptionConfig & { required: false }): boolean | null;
        boolean(config: IOptionConfig): boolean;
        boolean(description: string): boolean;

        guildMember(config: IOptionConfig & { required: false }): discord.GuildMember | null;
        guildMember(config: IOptionConfig): discord.GuildMember;
        guildMember(description: string): discord.GuildMember;

        guildChannel(config: IOptionConfig & { required: false }): discord.GuildChannel | null;
        guildChannel(config: IOptionConfig): discord.GuildChannel;
        guildChannel(description: string): discord.GuildChannel;

        guildRole(description: string): discord.Role;
        guildRole(config: IOptionConfig): discord.Role;
        guildRole(config: IOptionConfig & { required: false }): discord.Role | null;
      }

      interface ICommandConfig<T extends ResolvedOptions> {
        /**
         * The name of the command. Must not contain spaces and must be at least 2 characters in length.
         *
         * The name is used to execute the command from the client. For example, a command with the name `ping` may be executed with /ping.
         * Command names must be unique per bot/application.
         */
        name: string;
        /**
         * A short description of the command. Must not be empty.
         *
         * This description is displayed on Discord's command UI, under the command name.
         */
        description: string;
        /**
         * @deprecated After the Discord Slash Commands developer beta, source messages are always shown.
         * You can toggle the public visibility of source messages with the `ackBehavior` option.
         */
        showSourceMessage?: boolean;
        /**
         * Defines the acknowledgement behavior for this command. See the docs on [[discord.interactions.commands.AckBehavior]] for more information.
         *
         * Default: [[discord.interactions.commands.AckBehavior.AUTO_DEFAULT]]
         */
        ackBehavior?: discord.interactions.commands.AckBehavior;
        /**
         * Used to define options (or arguments) for the user to pass to the command. Must be a function that returns an object of key-value pairs.
         * The key is used as the option name, unless specified in the option constructor's config object.
         *
         * See [[discord.interactions.commands.IOptionProviders]] for a list of option types and their configs.
         *
         * Example (for a "kick" command's options):
         * ```ts
         * (opts) => ({
         *   user: opts.guildMember('The user to kick'),
         *   reason: opts.string({
         *     description: 'The reason for kicking them.',
         *     required: false
         *   })
         * })
         * ```
         */
        options?: OptionsFactory<T>;
      }

      const enum AckBehavior {
        /**
         * In this mode, Pylon will automatically acknowledge the command with a deferred response type if no response was sent within the acknowledge timeout window.
         *
         * If a response is not sent within ~250ms, the "<Bot> is thinking..." animation will be shown to all users in the channel.
         */
        AUTO_DEFAULT = 0,
        /**
         * In this mode, Pylon will automatically acknowledge the command with an deferred ephemeral response type if no response was sent within the acknowledge timeout window.
         *
         * If a response is not sent within ~250ms, the "<Bot> is thinking..." animation will be shown ephemerally to the user who ran the command.
         */
        AUTO_EPHEMERAL = 1,
        /**
         * In this mode, it will be up to the command handler to acknowledge the interaction.
         *
         * This mode is the most flexible, but may lead to interaction failures if interactions are not acknowledged within ~3 seconds.
         */
        MANUAL = 2,
      }

      interface ICommandGroupConfig {
        name: string;
        description: string;
      }

      type ResolvedOptions = { [key: string]: OptionType };
      type OptionsFactory<T extends ResolvedOptions> = (args: IOptionProviders) => T;
      type HandlerFunction<T> = (interaction: SlashCommandInteraction, args: T) => Promise<unknown>;

      class SlashCommand<T extends ResolvedOptions> {}

      class SlashCommandGroup extends SlashCommand<any> {
        /**
         * Registers a new sub-command within the command group.
         *
         * See [[discord.interactions.command.register]] for more information.
         *
         * @param config The configuration for this command. `name` and `description` must be specified.
         * @param handler The function to be ran when this sub-command is executed.
         */
        register<T extends ResolvedOptions>(
          config: ICommandConfig<T>,
          handler: HandlerFunction<T>
        ): SlashCommand<T>;

        /**
         * Registers a new nested sub-command group within the command group.
         *
         * Keep in mind the max sub-command group depth is 2.
         * This means you can create a root command group and apply command groups on it.
         *
         * @param config The config for the new command group. `name` and `description` must be specified.
         */
        registerGroup(config: ICommandGroupConfig): SlashCommandGroup;

        /**
         * A convince function to apply subcommands to a subcommand group in an isolated closure's scope.
         * @param fn
         */
        apply(fn: (commandGroup: this) => unknown): this;
      }

      /**
       * Options for an outgoing message response to a command invocation.
       *
       * `content` is required unless embeds are specified.
       */
      interface IResponseMessageOptions {
        /**
         * The string content of the message. Must be set if embeds are empty.
         */
        content?: string;
        /**
         * An array of Embed objects to attach to this response.
         */
        embeds?: Array<discord.Embed>;
        /**
         * The allowed mentions for this response. By default, 'everyone' and 'roles' are false.
         */
        allowedMentions?: discord.Message.IAllowedMentions;
        /**
         * If true, the message will be spoken via text-to-speech audio on the client (if enabled).
         */
        tts?: boolean;
      }

      interface IResponseMessageEditOptions {
        /**
         * The string contents of the message.
         */
        content?: string;
        /**
         * The embeds for this message.
         */
        embeds?: Array<discord.Embed>;
      }

      type ResponseMessageOptions =
        | (IResponseMessageOptions & { content: string })
        | (IResponseMessageOptions & { embeds: Array<discord.Embed>; content: undefined });

      class SlashCommandResponse {
        /**
         * Edits the slash command response.
         *
         * @param editedResponse A string or object describing the new message content.
         */
        edit(editedResponse: string | IResponseMessageEditOptions): Promise<void>;

        /**
         * Deletes the slash command response.
         */
        delete(): Promise<void>;
      }

      /**
       * Registers a new slash command. You may pass options and argument-type options to the `config` paramter.
       *
       * You must specify a handler to act on incoming command invocations.
       *
       * @param config Configuration for the command. Properties `name` and `description` must be present and valid.
       * @param handler An async function that takes two arguments, SlashCommandInteraction and a populated OptionsContainer. Called when the slash command is ran by a user.
       */
      function register<T extends ResolvedOptions>(
        config: ICommandConfig<T>,
        handler: HandlerFunction<T>
      ): SlashCommand<T>;

      /**
       * Registers a new slash command with the intent to add sub-command and/or sub-command groups.
       * You must pass a name and description in the first config object argument.
       *
       * You must register sub-commands or sub-command groups with the appropriate methods on SlashCommandGroup.
       *
       * @param config Configuration for the command. Properties `name` and `description` must be present and valid.
       */
      function registerGroup(config: ICommandGroupConfig): SlashCommandGroup;
    }
  }

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
      | "guildMemberOptional"
      | "guildChannel"
      | "guildChannelOptional"
      | "guildTextChannel"
      | "guildTextChannelOptional"
      | "guildVoiceChannel"
      | "guildVoiceChannelOptional";

    /**
     * A type union containing possible resolved argument types.
     */
    type ArgumentTypeTypes =
      | string
      | number
      | string[]
      | discord.User
      | discord.GuildMember
      | discord.GuildChannel
      | discord.GuildTextChannel
      | discord.GuildVoiceChannel;

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

    interface IStringArgumentOptions {
      /**
       * For a string argument, the valid options the string can be. Choices are case sensitive.
       */
      choices?: string[];
    }

    interface INumericArgumentOptions {
      /**
       * For a numeric argument, the valid options the number can be.
       */
      choices?: number[];
      /**
       * For a numeric argument (`integer` or `number`), the minimum value that will be accepted (inclusive of the value.)
       */
      minValue?: number;
      /**
       * For a numeric argument (`integer` or `number`), the maximum value that will be accepted (inclusive of the value.)
       */
      maxValue?: number;
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
      string(options?: IArgumentOptions & IStringArgumentOptions): string;

      /**
       * Optionally parses a single space-delimited argument as a string.
       * @param options argument config
       */
      stringOptional(options: IOptionalArgumentOptions<string> & IStringArgumentOptions): string;
      stringOptional(options?: IArgumentOptions & IStringArgumentOptions): string | null;

      /**
       * Parses a single space-delimited argument with parseInt()
       * Non-numeric inputs will cause the command to error. Floating point inputs are truncated.
       * @param options argument config
       */
      integer(options?: IArgumentOptions & INumericArgumentOptions): number;
      /**
       * Optionally parses a single space-delimited argument with parseInt()
       * Non-numeric inputs will cause the command to error. Floating point inputs are truncated.
       * @param options argument config
       */
      integerOptional(options: IOptionalArgumentOptions<number> & INumericArgumentOptions): number;
      integerOptional(options?: IArgumentOptions & INumericArgumentOptions): number | null;

      /**
       * Parses a single space-delimited argument with parseFloat()
       * Non-numeric inputs will cause the command to error.
       * @param options argument config
       */
      number(options?: IArgumentOptions & INumericArgumentOptions): number;
      /**
       * Optionally parses a single space-delimited argument with parseFloat()
       * Non-numeric inputs will cause the command to error.
       * @param options argument config
       */
      numberOptional(options: IOptionalArgumentOptions<number> & INumericArgumentOptions): number;
      numberOptional(options?: IArgumentOptions & INumericArgumentOptions): number | null;

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

      /**
       * Parses a mention string or channel id that resolves a [[discord.GuildChannel]] object reference.
       * If the channel was not found, the command will error.
       * The command will error if not used in a guild.
       */
      guildChannel(options?: IArgumentOptions): Promise<discord.GuildChannel>;

      /**
       * Optionally parses a mention string or channel id that resolves a [[discord.GuildChannel]] object reference.
       * If the channel was not found, the command will error.
       * The command will error if not used in a guild.
       */
      guildChannelOptional(options?: IArgumentOptions): Promise<discord.GuildChannel | null>;

      /**
       * Parses a mention string or channel id that resolves a [[discord.GuildTextChannel]] object reference.
       * If the channel was not found, or not a voice channel, the command will error.
       * The command will error if not used in a guild.
       */
      guildTextChannel(options?: IArgumentOptions): Promise<discord.GuildTextChannel>;

      /**
       * Optionally parses a mention string or channel id that resolves a [[discord.GuildTextChannel]] object reference.
       * If the channel was not found, or not a text channel, the command will error.
       * The command will error if not used in a guild.
       */
      guildTextChannelOptional(
        options?: IArgumentOptions
      ): Promise<discord.GuildTextChannel | null>;

      /**
       * Parses a mention string or channel id that resolves a [[discord.GuildVoiceChannel]] object reference.
       * If the channel was not found, or not a voice channel, the command will error.
       * The command will error if not used in a guild.
       */
      guildVoiceChannel(options?: IArgumentOptions): Promise<discord.GuildVoiceChannel>;

      /**
       * Optionally parses a mention string or channel id that resolves a [[discord.GuildVoiceChannel]] object reference.
       * If the channel was not found, or not a voice channel, the command will error.
       * The command will error if not used in a guild.
       */
      guildVoiceChannelOptional(
        options?: IArgumentOptions
      ): Promise<discord.GuildVoiceChannel | null>;
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
       * Any additional aliases that can be used to invoke this command.
       */
      aliases?: string[];
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
      | Promise<discord.GuildChannel>
      | Promise<discord.GuildChannel | null>
      | Promise<discord.GuildTextChannel>
      | Promise<discord.GuildTextChannel | null>
      | Promise<discord.GuildVoiceChannel>
      | Promise<discord.GuildVoiceChannel | null>
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

      getAliases(): Set<string>;
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
      subcommandGroup(
        options: string | Named<Omit<ICommandGroupOptions, "register">>
      ): CommandGroup;

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

      /**
       *
       * @private - Internal API, do not use.
       */
      getAliases(): Set<string>;
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
    REQUEST_TO_SPEAK = 1 << 32,
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
      MANAGE_EMOJIS |
      REQUEST_TO_SPEAK,
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
       * Emoji: 🎱
       */
      "8BALL" = "🎱",
      /**
       * Emoji: 🅰️
       */
      "A" = "🅰️",
      /**
       * Emoji: 🆎
       */
      "AB" = "🆎",
      /**
       * Emoji: 🧮
       */
      "ABACUS" = "🧮",
      /**
       * Emoji: 🔤
       */
      "ABC" = "🔤",
      /**
       * Emoji: 🔡
       */
      "ABCD" = "🔡",
      /**
       * Emoji: 🉑
       */
      "ACCEPT" = "🉑",
      /**
       * Emoji: 🪗
       */
      "ACCORDION" = "🪗",
      /**
       * Emoji: 🩹
       */
      "ADHESIVE_BANDAGE" = "🩹",
      /**
       * Emoji: 🎟️
       *
       * Aliases: `TICKETS`
       */
      "ADMISSION_TICKETS" = "🎟️",
      /**
       * Emoji: 🧑
       */
      "ADULT" = "🧑",
      /**
       * Emoji: 🚡
       */
      "AERIAL_TRAMWAY" = "🚡",
      /**
       * Emoji: ✈️
       */
      "AIRPLANE" = "✈️",
      /**
       * Emoji: 🛬
       */
      "AIRPLANE_ARRIVING" = "🛬",
      /**
       * Emoji: 🛫
       */
      "AIRPLANE_DEPARTURE" = "🛫",
      /**
       * Emoji: 🛩️
       *
       * Aliases: `SMALL_AIRPLANE`
       */
      "AIRPLANE_SMALL" = "🛩️",
      /**
       * Emoji: ⏰
       */
      "ALARM_CLOCK" = "⏰",
      /**
       * Emoji: ⚗️
       */
      "ALEMBIC" = "⚗️",
      /**
       * Emoji: 👽
       */
      "ALIEN" = "👽",
      /**
       * Emoji: 🚑
       */
      "AMBULANCE" = "🚑",
      /**
       * Emoji: 🏺
       */
      "AMPHORA" = "🏺",
      /**
       * Emoji: 🫀
       */
      "ANATOMICAL_HEART" = "🫀",
      /**
       * Emoji: ⚓
       */
      "ANCHOR" = "⚓",
      /**
       * Emoji: 👼
       */
      "ANGEL" = "👼",
      /**
       * Emoji: 💢
       */
      "ANGER" = "💢",
      /**
       * Emoji: 🗯️
       *
       * Aliases: `RIGHT_ANGER_BUBBLE`
       */
      "ANGER_RIGHT" = "🗯️",
      /**
       * Emoji: 😠
       */
      "ANGRY" = "😠",
      /**
       * Emoji: 😧
       */
      "ANGUISHED" = "😧",
      /**
       * Emoji: 🐜
       */
      "ANT" = "🐜",
      /**
       * Emoji: 🍎
       */
      "APPLE" = "🍎",
      /**
       * Emoji: ♒
       */
      "AQUARIUS" = "♒",
      /**
       * Emoji: 🏹
       *
       * Aliases: `BOW_AND_ARROW`
       */
      "ARCHERY" = "🏹",
      /**
       * Emoji: ♈
       */
      "ARIES" = "♈",
      /**
       * Emoji: 🔃
       */
      "ARROWS_CLOCKWISE" = "🔃",
      /**
       * Emoji: 🔄
       */
      "ARROWS_COUNTERCLOCKWISE" = "🔄",
      /**
       * Emoji: ◀️
       */
      "ARROW_BACKWARD" = "◀️",
      /**
       * Emoji: ⏬
       */
      "ARROW_DOUBLE_DOWN" = "⏬",
      /**
       * Emoji: ⏫
       */
      "ARROW_DOUBLE_UP" = "⏫",
      /**
       * Emoji: ⬇️
       */
      "ARROW_DOWN" = "⬇️",
      /**
       * Emoji: 🔽
       */
      "ARROW_DOWN_SMALL" = "🔽",
      /**
       * Emoji: ▶️
       */
      "ARROW_FORWARD" = "▶️",
      /**
       * Emoji: ⤵️
       */
      "ARROW_HEADING_DOWN" = "⤵️",
      /**
       * Emoji: ⤴️
       */
      "ARROW_HEADING_UP" = "⤴️",
      /**
       * Emoji: ⬅️
       */
      "ARROW_LEFT" = "⬅️",
      /**
       * Emoji: ↙️
       */
      "ARROW_LOWER_LEFT" = "↙️",
      /**
       * Emoji: ↘️
       */
      "ARROW_LOWER_RIGHT" = "↘️",
      /**
       * Emoji: ➡️
       */
      "ARROW_RIGHT" = "➡️",
      /**
       * Emoji: ↪️
       */
      "ARROW_RIGHT_HOOK" = "↪️",
      /**
       * Emoji: ⬆️
       */
      "ARROW_UP" = "⬆️",
      /**
       * Emoji: ↖️
       */
      "ARROW_UPPER_LEFT" = "↖️",
      /**
       * Emoji: ↗️
       */
      "ARROW_UPPER_RIGHT" = "↗️",
      /**
       * Emoji: ↕️
       */
      "ARROW_UP_DOWN" = "↕️",
      /**
       * Emoji: 🔼
       */
      "ARROW_UP_SMALL" = "🔼",
      /**
       * Emoji: 🎨
       */
      "ART" = "🎨",
      /**
       * Emoji: 🚛
       */
      "ARTICULATED_LORRY" = "🚛",
      /**
       * Emoji: 🧑‍🎨
       */
      "ARTIST" = "🧑‍🎨",
      /**
       * Emoji: *️⃣
       *
       * Aliases: `KEYCAP_ASTERISK`
       */
      "ASTERISK" = "*️⃣",
      /**
       * Emoji: 😲
       */
      "ASTONISHED" = "😲",
      /**
       * Emoji: 🧑‍🚀
       */
      "ASTRONAUT" = "🧑‍🚀",
      /**
       * Emoji: 👟
       */
      "ATHLETIC_SHOE" = "👟",
      /**
       * Emoji: 🏧
       */
      "ATM" = "🏧",
      /**
       * Emoji: ⚛️
       *
       * Aliases: `ATOM_SYMBOL`
       */
      "ATOM" = "⚛️",
      /**
       * Emoji: ⚛️
       *
       * Aliases: `ATOM`
       */
      "ATOM_SYMBOL" = "⚛️",
      /**
       * Emoji: 🛺
       */
      "AUTO_RICKSHAW" = "🛺",
      /**
       * Emoji: 🥑
       */
      "AVOCADO" = "🥑",
      /**
       * Emoji: 🪓
       */
      "AXE" = "🪓",
      /**
       * Emoji: 🅱️
       */
      "B" = "🅱️",
      /**
       * Emoji: 👶
       */
      "BABY" = "👶",
      /**
       * Emoji: 🍼
       */
      "BABY_BOTTLE" = "🍼",
      /**
       * Emoji: 🐤
       */
      "BABY_CHICK" = "🐤",
      /**
       * Emoji: 🚼
       */
      "BABY_SYMBOL" = "🚼",
      /**
       * Emoji: 🔙
       */
      "BACK" = "🔙",
      /**
       * Emoji: 🤚
       *
       * Aliases: `RAISED_BACK_OF_HAND`
       */
      "BACK_OF_HAND" = "🤚",
      /**
       * Emoji: 🥓
       */
      "BACON" = "🥓",
      /**
       * Emoji: 🦡
       */
      "BADGER" = "🦡",
      /**
       * Emoji: 🏸
       */
      "BADMINTON" = "🏸",
      /**
       * Emoji: 🥯
       */
      "BAGEL" = "🥯",
      /**
       * Emoji: 🛄
       */
      "BAGGAGE_CLAIM" = "🛄",
      /**
       * Emoji: 🥖
       *
       * Aliases: `FRENCH_BREAD`
       */
      "BAGUETTE_BREAD" = "🥖",
      /**
       * Emoji: 🩰
       */
      "BALLET_SHOES" = "🩰",
      /**
       * Emoji: 🎈
       */
      "BALLOON" = "🎈",
      /**
       * Emoji: 🗳️
       *
       * Aliases: `BALLOT_BOX_WITH_BALLOT`
       */
      "BALLOT_BOX" = "🗳️",
      /**
       * Emoji: 🗳️
       *
       * Aliases: `BALLOT_BOX`
       */
      "BALLOT_BOX_WITH_BALLOT" = "🗳️",
      /**
       * Emoji: ☑️
       */
      "BALLOT_BOX_WITH_CHECK" = "☑️",
      /**
       * Emoji: 🎍
       */
      "BAMBOO" = "🎍",
      /**
       * Emoji: 🍌
       */
      "BANANA" = "🍌",
      /**
       * Emoji: ‼️
       */
      "BANGBANG" = "‼️",
      /**
       * Emoji: 🪕
       */
      "BANJO" = "🪕",
      /**
       * Emoji: 🏦
       */
      "BANK" = "🏦",
      /**
       * Emoji: 💈
       */
      "BARBER" = "💈",
      /**
       * Emoji: 📊
       */
      "BAR_CHART" = "📊",
      /**
       * Emoji: ⚾
       */
      "BASEBALL" = "⚾",
      /**
       * Emoji: 🧺
       */
      "BASKET" = "🧺",
      /**
       * Emoji: 🏀
       */
      "BASKETBALL" = "🏀",
      /**
       * Emoji: ⛹️
       *
       * Aliases: `PERSON_BOUNCING_BALL`,`PERSON_WITH_BALL`
       */
      "BASKETBALL_PLAYER" = "⛹️",
      /**
       * Emoji: 🦇
       */
      "BAT" = "🦇",
      /**
       * Emoji: 🛀
       */
      "BATH" = "🛀",
      /**
       * Emoji: 🛁
       */
      "BATHTUB" = "🛁",
      /**
       * Emoji: 🔋
       */
      "BATTERY" = "🔋",
      /**
       * Emoji: 🏖️
       *
       * Aliases: `BEACH_WITH_UMBRELLA`
       */
      "BEACH" = "🏖️",
      /**
       * Emoji: ⛱️
       *
       * Aliases: `UMBRELLA_ON_GROUND`
       */
      "BEACH_UMBRELLA" = "⛱️",
      /**
       * Emoji: 🏖️
       *
       * Aliases: `BEACH`
       */
      "BEACH_WITH_UMBRELLA" = "🏖️",
      /**
       * Emoji: 🐻
       */
      "BEAR" = "🐻",
      /**
       * Emoji: 🧔
       */
      "BEARDED_PERSON" = "🧔",
      /**
       * Emoji: 🦫
       */
      "BEAVER" = "🦫",
      /**
       * Emoji: 🛏️
       */
      "BED" = "🛏️",
      /**
       * Emoji: 🐝
       */
      "BEE" = "🐝",
      /**
       * Emoji: 🍺
       */
      "BEER" = "🍺",
      /**
       * Emoji: 🍻
       */
      "BEERS" = "🍻",
      /**
       * Emoji: 🪲
       */
      "BEETLE" = "🪲",
      /**
       * Emoji: 🔰
       */
      "BEGINNER" = "🔰",
      /**
       * Emoji: 🔔
       */
      "BELL" = "🔔",
      /**
       * Emoji: 🛎️
       *
       * Aliases: `BELLHOP_BELL`
       */
      "BELLHOP" = "🛎️",
      /**
       * Emoji: 🛎️
       *
       * Aliases: `BELLHOP`
       */
      "BELLHOP_BELL" = "🛎️",
      /**
       * Emoji: 🫑
       */
      "BELL_PEPPER" = "🫑",
      /**
       * Emoji: 🍱
       */
      "BENTO" = "🍱",
      /**
       * Emoji: 🧃
       */
      "BEVERAGE_BOX" = "🧃",
      /**
       * Emoji: 🚴
       *
       * Aliases: `PERSON_BIKING`
       */
      "BICYCLIST" = "🚴",
      /**
       * Emoji: 🚲
       */
      "BIKE" = "🚲",
      /**
       * Emoji: 👙
       */
      "BIKINI" = "👙",
      /**
       * Emoji: 🧢
       */
      "BILLED_CAP" = "🧢",
      /**
       * Emoji: ☣️
       *
       * Aliases: `BIOHAZARD_SIGN`
       */
      "BIOHAZARD" = "☣️",
      /**
       * Emoji: ☣️
       *
       * Aliases: `BIOHAZARD`
       */
      "BIOHAZARD_SIGN" = "☣️",
      /**
       * Emoji: 🐦
       */
      "BIRD" = "🐦",
      /**
       * Emoji: 🎂
       */
      "BIRTHDAY" = "🎂",
      /**
       * Emoji: 🦬
       */
      "BISON" = "🦬",
      /**
       * Emoji: 🐈‍⬛
       */
      "BLACK_CAT" = "🐈‍⬛",
      /**
       * Emoji: ⚫
       */
      "BLACK_CIRCLE" = "⚫",
      /**
       * Emoji: 🖤
       */
      "BLACK_HEART" = "🖤",
      /**
       * Emoji: 🃏
       */
      "BLACK_JOKER" = "🃏",
      /**
       * Emoji: ⬛
       */
      "BLACK_LARGE_SQUARE" = "⬛",
      /**
       * Emoji: ◾
       */
      "BLACK_MEDIUM_SMALL_SQUARE" = "◾",
      /**
       * Emoji: ◼️
       */
      "BLACK_MEDIUM_SQUARE" = "◼️",
      /**
       * Emoji: ✒️
       */
      "BLACK_NIB" = "✒️",
      /**
       * Emoji: ▪️
       */
      "BLACK_SMALL_SQUARE" = "▪️",
      /**
       * Emoji: 🔲
       */
      "BLACK_SQUARE_BUTTON" = "🔲",
      /**
       * Emoji: 👱‍♂️
       */
      "BLOND_HAIRED_MAN" = "👱‍♂️",
      /**
       * Emoji: 👱
       *
       * Aliases: `PERSON_WITH_BLOND_HAIR`
       */
      "BLOND_HAIRED_PERSON" = "👱",
      /**
       * Emoji: 👱‍♀️
       */
      "BLOND_HAIRED_WOMAN" = "👱‍♀️",
      /**
       * Emoji: 🌼
       */
      "BLOSSOM" = "🌼",
      /**
       * Emoji: 🐡
       */
      "BLOWFISH" = "🐡",
      /**
       * Emoji: 🫐
       */
      "BLUEBERRIES" = "🫐",
      /**
       * Emoji: 📘
       */
      "BLUE_BOOK" = "📘",
      /**
       * Emoji: 🚙
       */
      "BLUE_CAR" = "🚙",
      /**
       * Emoji: 🔵
       */
      "BLUE_CIRCLE" = "🔵",
      /**
       * Emoji: 💙
       */
      "BLUE_HEART" = "💙",
      /**
       * Emoji: 🟦
       */
      "BLUE_SQUARE" = "🟦",
      /**
       * Emoji: 😊
       */
      "BLUSH" = "😊",
      /**
       * Emoji: 🐗
       */
      "BOAR" = "🐗",
      /**
       * Emoji: 💣
       */
      "BOMB" = "💣",
      /**
       * Emoji: 🦴
       */
      "BONE" = "🦴",
      /**
       * Emoji: 📖
       */
      "BOOK" = "📖",
      /**
       * Emoji: 🔖
       */
      "BOOKMARK" = "🔖",
      /**
       * Emoji: 📑
       */
      "BOOKMARK_TABS" = "📑",
      /**
       * Emoji: 📚
       */
      "BOOKS" = "📚",
      /**
       * Emoji: 💥
       */
      "BOOM" = "💥",
      /**
       * Emoji: 🪃
       */
      "BOOMERANG" = "🪃",
      /**
       * Emoji: 👢
       */
      "BOOT" = "👢",
      /**
       * Emoji: 🍾
       *
       * Aliases: `CHAMPAGNE`
       */
      "BOTTLE_WITH_POPPING_CORK" = "🍾",
      /**
       * Emoji: 💐
       */
      "BOUQUET" = "💐",
      /**
       * Emoji: 🙇
       *
       * Aliases: `PERSON_BOWING`
       */
      "BOW" = "🙇",
      /**
       * Emoji: 🎳
       */
      "BOWLING" = "🎳",
      /**
       * Emoji: 🥣
       */
      "BOWL_WITH_SPOON" = "🥣",
      /**
       * Emoji: 🏹
       *
       * Aliases: `ARCHERY`
       */
      "BOW_AND_ARROW" = "🏹",
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
       * Emoji: 👦
       */
      "BOY" = "👦",
      /**
       * Emoji: 🧠
       */
      "BRAIN" = "🧠",
      /**
       * Emoji: 🍞
       */
      "BREAD" = "🍞",
      /**
       * Emoji: 🤱
       */
      "BREAST_FEEDING" = "🤱",
      /**
       * Emoji: 🧱
       */
      "BRICKS" = "🧱",
      /**
       * Emoji: 👰‍♀️
       *
       * Aliases: `WOMAN_WITH_VEIL`
       */
      "BRIDE_WITH_VEIL" = "👰‍♀️",
      /**
       * Emoji: 🌉
       */
      "BRIDGE_AT_NIGHT" = "🌉",
      /**
       * Emoji: 💼
       */
      "BRIEFCASE" = "💼",
      /**
       * Emoji: 🩲
       */
      "BRIEFS" = "🩲",
      /**
       * Emoji: 🥦
       */
      "BROCCOLI" = "🥦",
      /**
       * Emoji: 💔
       */
      "BROKEN_HEART" = "💔",
      /**
       * Emoji: 🧹
       */
      "BROOM" = "🧹",
      /**
       * Emoji: 🟤
       */
      "BROWN_CIRCLE" = "🟤",
      /**
       * Emoji: 🤎
       */
      "BROWN_HEART" = "🤎",
      /**
       * Emoji: 🟫
       */
      "BROWN_SQUARE" = "🟫",
      /**
       * Emoji: 🧋
       */
      "BUBBLE_TEA" = "🧋",
      /**
       * Emoji: 🪣
       */
      "BUCKET" = "🪣",
      /**
       * Emoji: 🐛
       */
      "BUG" = "🐛",
      /**
       * Emoji: 🏗️
       *
       * Aliases: `CONSTRUCTION_SITE`
       */
      "BUILDING_CONSTRUCTION" = "🏗️",
      /**
       * Emoji: 💡
       */
      "BULB" = "💡",
      /**
       * Emoji: 🚅
       */
      "BULLETTRAIN_FRONT" = "🚅",
      /**
       * Emoji: 🚄
       */
      "BULLETTRAIN_SIDE" = "🚄",
      /**
       * Emoji: 🌯
       */
      "BURRITO" = "🌯",
      /**
       * Emoji: 🚌
       */
      "BUS" = "🚌",
      /**
       * Emoji: 🚏
       */
      "BUSSTOP" = "🚏",
      /**
       * Emoji: 👥
       */
      "BUSTS_IN_SILHOUETTE" = "👥",
      /**
       * Emoji: 👤
       */
      "BUST_IN_SILHOUETTE" = "👤",
      /**
       * Emoji: 🧈
       */
      "BUTTER" = "🧈",
      /**
       * Emoji: 🦋
       */
      "BUTTERFLY" = "🦋",
      /**
       * Emoji: 🌵
       */
      "CACTUS" = "🌵",
      /**
       * Emoji: 🍰
       */
      "CAKE" = "🍰",
      /**
       * Emoji: 📆
       */
      "CALENDAR" = "📆",
      /**
       * Emoji: 🗓️
       *
       * Aliases: `SPIRAL_CALENDAR_PAD`
       */
      "CALENDAR_SPIRAL" = "🗓️",
      /**
       * Emoji: 📲
       */
      "CALLING" = "📲",
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
       * Emoji: 🐫
       */
      "CAMEL" = "🐫",
      /**
       * Emoji: 📷
       */
      "CAMERA" = "📷",
      /**
       * Emoji: 📸
       */
      "CAMERA_WITH_FLASH" = "📸",
      /**
       * Emoji: 🏕️
       */
      "CAMPING" = "🏕️",
      /**
       * Emoji: ♋
       */
      "CANCER" = "♋",
      /**
       * Emoji: 🕯️
       */
      "CANDLE" = "🕯️",
      /**
       * Emoji: 🍬
       */
      "CANDY" = "🍬",
      /**
       * Emoji: 🥫
       */
      "CANNED_FOOD" = "🥫",
      /**
       * Emoji: 🛶
       *
       * Aliases: `KAYAK`
       */
      "CANOE" = "🛶",
      /**
       * Emoji: 🔠
       */
      "CAPITAL_ABCD" = "🔠",
      /**
       * Emoji: ♑
       */
      "CAPRICORN" = "♑",
      /**
       * Emoji: 🗃️
       *
       * Aliases: `CARD_FILE_BOX`
       */
      "CARD_BOX" = "🗃️",
      /**
       * Emoji: 🗃️
       *
       * Aliases: `CARD_BOX`
       */
      "CARD_FILE_BOX" = "🗃️",
      /**
       * Emoji: 📇
       */
      "CARD_INDEX" = "📇",
      /**
       * Emoji: 🗂️
       *
       * Aliases: `DIVIDERS`
       */
      "CARD_INDEX_DIVIDERS" = "🗂️",
      /**
       * Emoji: 🎠
       */
      "CAROUSEL_HORSE" = "🎠",
      /**
       * Emoji: 🪚
       */
      "CARPENTRY_SAW" = "🪚",
      /**
       * Emoji: 🥕
       */
      "CARROT" = "🥕",
      /**
       * Emoji: 🤸
       *
       * Aliases: `PERSON_DOING_CARTWHEEL`
       */
      "CARTWHEEL" = "🤸",
      /**
       * Emoji: 🐱
       */
      "CAT" = "🐱",
      /**
       * Emoji: 🐈
       */
      "CAT2" = "🐈",
      /**
       * Emoji: 💿
       */
      "CD" = "💿",
      /**
       * Emoji: ⛓️
       */
      "CHAINS" = "⛓️",
      /**
       * Emoji: 🪑
       */
      "CHAIR" = "🪑",
      /**
       * Emoji: 🍾
       *
       * Aliases: `BOTTLE_WITH_POPPING_CORK`
       */
      "CHAMPAGNE" = "🍾",
      /**
       * Emoji: 🥂
       *
       * Aliases: `CLINKING_GLASS`
       */
      "CHAMPAGNE_GLASS" = "🥂",
      /**
       * Emoji: 💹
       */
      "CHART" = "💹",
      /**
       * Emoji: 📉
       */
      "CHART_WITH_DOWNWARDS_TREND" = "📉",
      /**
       * Emoji: 📈
       */
      "CHART_WITH_UPWARDS_TREND" = "📈",
      /**
       * Emoji: 🏁
       */
      "CHECKERED_FLAG" = "🏁",
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
       * Emoji: 🍒
       */
      "CHERRIES" = "🍒",
      /**
       * Emoji: 🌸
       */
      "CHERRY_BLOSSOM" = "🌸",
      /**
       * Emoji: ♟️
       */
      "CHESS_PAWN" = "♟️",
      /**
       * Emoji: 🌰
       */
      "CHESTNUT" = "🌰",
      /**
       * Emoji: 🐔
       */
      "CHICKEN" = "🐔",
      /**
       * Emoji: 🧒
       */
      "CHILD" = "🧒",
      /**
       * Emoji: 🚸
       */
      "CHILDREN_CROSSING" = "🚸",
      /**
       * Emoji: 🐿️
       */
      "CHIPMUNK" = "🐿️",
      /**
       * Emoji: 🍫
       */
      "CHOCOLATE_BAR" = "🍫",
      /**
       * Emoji: 🥢
       */
      "CHOPSTICKS" = "🥢",
      /**
       * Emoji: 🎄
       */
      "CHRISTMAS_TREE" = "🎄",
      /**
       * Emoji: ⛪
       */
      "CHURCH" = "⛪",
      /**
       * Emoji: 🎦
       */
      "CINEMA" = "🎦",
      /**
       * Emoji: 🎪
       */
      "CIRCUS_TENT" = "🎪",
      /**
       * Emoji: 🏙️
       */
      "CITYSCAPE" = "🏙️",
      /**
       * Emoji: 🌆
       */
      "CITY_DUSK" = "🌆",
      /**
       * Emoji: 🌇
       *
       * Aliases: `CITY_SUNSET`
       */
      "CITY_SUNRISE" = "🌇",
      /**
       * Emoji: 🌇
       *
       * Aliases: `CITY_SUNRISE`
       */
      "CITY_SUNSET" = "🌇",
      /**
       * Emoji: 🆑
       */
      "CL" = "🆑",
      /**
       * Emoji: 👏
       */
      "CLAP" = "👏",
      /**
       * Emoji: 🎬
       */
      "CLAPPER" = "🎬",
      /**
       * Emoji: 🏛️
       */
      "CLASSICAL_BUILDING" = "🏛️",
      /**
       * Emoji: 🥂
       *
       * Aliases: `CHAMPAGNE_GLASS`
       */
      "CLINKING_GLASS" = "🥂",
      /**
       * Emoji: 📋
       */
      "CLIPBOARD" = "📋",
      /**
       * Emoji: 🕰️
       *
       * Aliases: `MANTLEPIECE_CLOCK`
       */
      "CLOCK" = "🕰️",
      /**
       * Emoji: 🕐
       */
      "CLOCK1" = "🕐",
      /**
       * Emoji: 🕙
       */
      "CLOCK10" = "🕙",
      /**
       * Emoji: 🕥
       */
      "CLOCK1030" = "🕥",
      /**
       * Emoji: 🕚
       */
      "CLOCK11" = "🕚",
      /**
       * Emoji: 🕦
       */
      "CLOCK1130" = "🕦",
      /**
       * Emoji: 🕛
       */
      "CLOCK12" = "🕛",
      /**
       * Emoji: 🕧
       */
      "CLOCK1230" = "🕧",
      /**
       * Emoji: 🕜
       */
      "CLOCK130" = "🕜",
      /**
       * Emoji: 🕑
       */
      "CLOCK2" = "🕑",
      /**
       * Emoji: 🕝
       */
      "CLOCK230" = "🕝",
      /**
       * Emoji: 🕒
       */
      "CLOCK3" = "🕒",
      /**
       * Emoji: 🕞
       */
      "CLOCK330" = "🕞",
      /**
       * Emoji: 🕓
       */
      "CLOCK4" = "🕓",
      /**
       * Emoji: 🕟
       */
      "CLOCK430" = "🕟",
      /**
       * Emoji: 🕔
       */
      "CLOCK5" = "🕔",
      /**
       * Emoji: 🕠
       */
      "CLOCK530" = "🕠",
      /**
       * Emoji: 🕕
       */
      "CLOCK6" = "🕕",
      /**
       * Emoji: 🕡
       */
      "CLOCK630" = "🕡",
      /**
       * Emoji: 🕖
       */
      "CLOCK7" = "🕖",
      /**
       * Emoji: 🕢
       */
      "CLOCK730" = "🕢",
      /**
       * Emoji: 🕗
       */
      "CLOCK8" = "🕗",
      /**
       * Emoji: 🕣
       */
      "CLOCK830" = "🕣",
      /**
       * Emoji: 🕘
       */
      "CLOCK9" = "🕘",
      /**
       * Emoji: 🕤
       */
      "CLOCK930" = "🕤",
      /**
       * Emoji: 📕
       */
      "CLOSED_BOOK" = "📕",
      /**
       * Emoji: 🔐
       */
      "CLOSED_LOCK_WITH_KEY" = "🔐",
      /**
       * Emoji: 🌂
       */
      "CLOSED_UMBRELLA" = "🌂",
      /**
       * Emoji: ☁️
       */
      "CLOUD" = "☁️",
      /**
       * Emoji: 🌩️
       *
       * Aliases: `CLOUD_WITH_LIGHTNING`
       */
      "CLOUD_LIGHTNING" = "🌩️",
      /**
       * Emoji: 🌧️
       *
       * Aliases: `CLOUD_WITH_RAIN`
       */
      "CLOUD_RAIN" = "🌧️",
      /**
       * Emoji: 🌨️
       *
       * Aliases: `CLOUD_WITH_SNOW`
       */
      "CLOUD_SNOW" = "🌨️",
      /**
       * Emoji: 🌪️
       *
       * Aliases: `CLOUD_WITH_TORNADO`
       */
      "CLOUD_TORNADO" = "🌪️",
      /**
       * Emoji: 🌩️
       *
       * Aliases: `CLOUD_LIGHTNING`
       */
      "CLOUD_WITH_LIGHTNING" = "🌩️",
      /**
       * Emoji: 🌧️
       *
       * Aliases: `CLOUD_RAIN`
       */
      "CLOUD_WITH_RAIN" = "🌧️",
      /**
       * Emoji: 🌨️
       *
       * Aliases: `CLOUD_SNOW`
       */
      "CLOUD_WITH_SNOW" = "🌨️",
      /**
       * Emoji: 🌪️
       *
       * Aliases: `CLOUD_TORNADO`
       */
      "CLOUD_WITH_TORNADO" = "🌪️",
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
       * Emoji: ♣️
       */
      "CLUBS" = "♣️",
      /**
       * Emoji: 🧥
       */
      "COAT" = "🧥",
      /**
       * Emoji: 🪳
       */
      "COCKROACH" = "🪳",
      /**
       * Emoji: 🍸
       */
      "COCKTAIL" = "🍸",
      /**
       * Emoji: 🥥
       */
      "COCONUT" = "🥥",
      /**
       * Emoji: ☕
       */
      "COFFEE" = "☕",
      /**
       * Emoji: ⚰️
       */
      "COFFIN" = "⚰️",
      /**
       * Emoji: 🪙
       */
      "COIN" = "🪙",
      /**
       * Emoji: 🥶
       */
      "COLD_FACE" = "🥶",
      /**
       * Emoji: 😰
       */
      "COLD_SWEAT" = "😰",
      /**
       * Emoji: ☄️
       */
      "COMET" = "☄️",
      /**
       * Emoji: 🧭
       */
      "COMPASS" = "🧭",
      /**
       * Emoji: 🗜️
       */
      "COMPRESSION" = "🗜️",
      /**
       * Emoji: 💻
       */
      "COMPUTER" = "💻",
      /**
       * Emoji: 🎊
       */
      "CONFETTI_BALL" = "🎊",
      /**
       * Emoji: 😖
       */
      "CONFOUNDED" = "😖",
      /**
       * Emoji: 😕
       */
      "CONFUSED" = "😕",
      /**
       * Emoji: ㊗️
       */
      "CONGRATULATIONS" = "㊗️",
      /**
       * Emoji: 🚧
       */
      "CONSTRUCTION" = "🚧",
      /**
       * Emoji: 🏗️
       *
       * Aliases: `BUILDING_CONSTRUCTION`
       */
      "CONSTRUCTION_SITE" = "🏗️",
      /**
       * Emoji: 👷
       */
      "CONSTRUCTION_WORKER" = "👷",
      /**
       * Emoji: 🎛️
       */
      "CONTROL_KNOBS" = "🎛️",
      /**
       * Emoji: 🏪
       */
      "CONVENIENCE_STORE" = "🏪",
      /**
       * Emoji: 🧑‍🍳
       */
      "COOK" = "🧑‍🍳",
      /**
       * Emoji: 🍪
       */
      "COOKIE" = "🍪",
      /**
       * Emoji: 🍳
       */
      "COOKING" = "🍳",
      /**
       * Emoji: 🆒
       */
      "COOL" = "🆒",
      /**
       * Emoji: 👮
       *
       * Aliases: `POLICE_OFFICER`
       */
      "COP" = "👮",
      /**
       * Emoji: ©️
       */
      "COPYRIGHT" = "©️",
      /**
       * Emoji: 🌽
       */
      "CORN" = "🌽",
      /**
       * Emoji: 🛋️
       *
       * Aliases: `COUCH_AND_LAMP`
       */
      "COUCH" = "🛋️",
      /**
       * Emoji: 🛋️
       *
       * Aliases: `COUCH`
       */
      "COUCH_AND_LAMP" = "🛋️",
      /**
       * Emoji: 👫
       */
      "COUPLE" = "👫",
      /**
       * Emoji: 💏
       */
      "COUPLEKISS" = "💏",
      /**
       * Emoji: 👨‍❤️‍💋‍👨
       *
       * Aliases: `KISS_MM`
       */
      "COUPLEKISS_MM" = "👨‍❤️‍💋‍👨",
      /**
       * Emoji: 👩‍❤️‍💋‍👩
       *
       * Aliases: `KISS_WW`
       */
      "COUPLEKISS_WW" = "👩‍❤️‍💋‍👩",
      /**
       * Emoji: 👨‍❤️‍👨
       *
       * Aliases: `COUPLE_WITH_HEART_MM`
       */
      "COUPLE_MM" = "👨‍❤️‍👨",
      /**
       * Emoji: 💑
       */
      "COUPLE_WITH_HEART" = "💑",
      /**
       * Emoji: 👨‍❤️‍👨
       *
       * Aliases: `COUPLE_MM`
       */
      "COUPLE_WITH_HEART_MM" = "👨‍❤️‍👨",
      /**
       * Emoji: 👩‍❤️‍👨
       */
      "COUPLE_WITH_HEART_WOMAN_MAN" = "👩‍❤️‍👨",
      /**
       * Emoji: 👩‍❤️‍👩
       *
       * Aliases: `COUPLE_WW`
       */
      "COUPLE_WITH_HEART_WW" = "👩‍❤️‍👩",
      /**
       * Emoji: 👩‍❤️‍👩
       *
       * Aliases: `COUPLE_WITH_HEART_WW`
       */
      "COUPLE_WW" = "👩‍❤️‍👩",
      /**
       * Emoji: 🐮
       */
      "COW" = "🐮",
      /**
       * Emoji: 🐄
       */
      "COW2" = "🐄",
      /**
       * Emoji: 🤠
       *
       * Aliases: `FACE_WITH_COWBOY_HAT`
       */
      "COWBOY" = "🤠",
      /**
       * Emoji: 🦀
       */
      "CRAB" = "���",
      /**
       * Emoji: 🖍️
       *
       * Aliases: `LOWER_LEFT_CRAYON`
       */
      "CRAYON" = "🖍️",
      /**
       * Emoji: 💳
       */
      "CREDIT_CARD" = "💳",
      /**
       * Emoji: 🌙
       */
      "CRESCENT_MOON" = "🌙",
      /**
       * Emoji: 🦗
       */
      "CRICKET" = "🦗",
      /**
       * Emoji: 🏏
       *
       * Aliases: `CRICKET_GAME`
       */
      "CRICKET_BAT_BALL" = "🏏",
      /**
       * Emoji: 🏏
       *
       * Aliases: `CRICKET_BAT_BALL`
       */
      "CRICKET_GAME" = "🏏",
      /**
       * Emoji: 🐊
       */
      "CROCODILE" = "🐊",
      /**
       * Emoji: 🥐
       */
      "CROISSANT" = "🥐",
      /**
       * Emoji: ✝️
       *
       * Aliases: `LATIN_CROSS`
       */
      "CROSS" = "✝️",
      /**
       * Emoji: 🎌
       */
      "CROSSED_FLAGS" = "🎌",
      /**
       * Emoji: ⚔️
       */
      "CROSSED_SWORDS" = "⚔️",
      /**
       * Emoji: 👑
       */
      "CROWN" = "👑",
      /**
       * Emoji: 🛳️
       *
       * Aliases: `PASSENGER_SHIP`
       */
      "CRUISE_SHIP" = "🛳️",
      /**
       * Emoji: 😢
       */
      "CRY" = "😢",
      /**
       * Emoji: 😿
       */
      "CRYING_CAT_FACE" = "😿",
      /**
       * Emoji: 🔮
       */
      "CRYSTAL_BALL" = "🔮",
      /**
       * Emoji: 🥒
       */
      "CUCUMBER" = "🥒",
      /**
       * Emoji: 🧁
       */
      "CUPCAKE" = "🧁",
      /**
       * Emoji: 💘
       */
      "CUPID" = "💘",
      /**
       * Emoji: 🥤
       */
      "CUP_WITH_STRAW" = "🥤",
      /**
       * Emoji: 🥌
       */
      "CURLING_STONE" = "🥌",
      /**
       * Emoji: ➰
       */
      "CURLY_LOOP" = "➰",
      /**
       * Emoji: 💱
       */
      "CURRENCY_EXCHANGE" = "💱",
      /**
       * Emoji: 🍛
       */
      "CURRY" = "🍛",
      /**
       * Emoji: 🍮
       *
       * Aliases: `PUDDING`,`FLAN`
       */
      "CUSTARD" = "🍮",
      /**
       * Emoji: 🛃
       */
      "CUSTOMS" = "🛃",
      /**
       * Emoji: 🥩
       */
      "CUT_OF_MEAT" = "🥩",
      /**
       * Emoji: 🌀
       */
      "CYCLONE" = "🌀",
      /**
       * Emoji: 🗡️
       *
       * Aliases: `DAGGER_KNIFE`
       */
      "DAGGER" = "🗡️",
      /**
       * Emoji: 🗡️
       *
       * Aliases: `DAGGER`
       */
      "DAGGER_KNIFE" = "🗡️",
      /**
       * Emoji: 💃
       */
      "DANCER" = "💃",
      /**
       * Emoji: 👯
       *
       * Aliases: `PEOPLE_WITH_BUNNY_EARS_PARTYING`
       */
      "DANCERS" = "👯",
      /**
       * Emoji: 🍡
       */
      "DANGO" = "🍡",
      /**
       * Emoji: 🕶️
       */
      "DARK_SUNGLASSES" = "🕶️",
      /**
       * Emoji: 🎯
       */
      "DART" = "🎯",
      /**
       * Emoji: 💨
       */
      "DASH" = "💨",
      /**
       * Emoji: 📅
       */
      "DATE" = "📅",
      /**
       * Emoji: 🧏‍♂️
       */
      "DEAF_MAN" = "🧏‍♂️",
      /**
       * Emoji: 🧏
       */
      "DEAF_PERSON" = "🧏",
      /**
       * Emoji: 🧏‍♀️
       */
      "DEAF_WOMAN" = "🧏‍♀️",
      /**
       * Emoji: 🌳
       */
      "DECIDUOUS_TREE" = "🌳",
      /**
       * Emoji: 🦌
       */
      "DEER" = "🦌",
      /**
       * Emoji: 🏬
       */
      "DEPARTMENT_STORE" = "🏬",
      /**
       * Emoji: 🏚️
       *
       * Aliases: `HOUSE_ABANDONED`
       */
      "DERELICT_HOUSE_BUILDING" = "🏚️",
      /**
       * Emoji: 🏜️
       */
      "DESERT" = "🏜️",
      /**
       * Emoji: 🏝️
       *
       * Aliases: `ISLAND`
       */
      "DESERT_ISLAND" = "🏝️",
      /**
       * Emoji: 🖥️
       *
       * Aliases: `DESKTOP_COMPUTER`
       */
      "DESKTOP" = "🖥️",
      /**
       * Emoji: 🖥️
       *
       * Aliases: `DESKTOP`
       */
      "DESKTOP_COMPUTER" = "🖥️",
      /**
       * Emoji: 🕵️
       *
       * Aliases: `SPY`,`SLEUTH_OR_SPY`
       */
      "DETECTIVE" = "🕵️",
      /**
       * Emoji: ♦️
       */
      "DIAMONDS" = "♦️",
      /**
       * Emoji: 💠
       */
      "DIAMOND_SHAPE_WITH_A_DOT_INSIDE" = "💠",
      /**
       * Emoji: 😞
       */
      "DISAPPOINTED" = "😞",
      /**
       * Emoji: 😥
       */
      "DISAPPOINTED_RELIEVED" = "😥",
      /**
       * Emoji: 🥸
       */
      "DISGUISED_FACE" = "🥸",
      /**
       * Emoji: 🗂️
       *
       * Aliases: `CARD_INDEX_DIVIDERS`
       */
      "DIVIDERS" = "🗂️",
      /**
       * Emoji: 🤿
       */
      "DIVING_MASK" = "🤿",
      /**
       * Emoji: 🪔
       */
      "DIYA_LAMP" = "🪔",
      /**
       * Emoji: 💫
       */
      "DIZZY" = "💫",
      /**
       * Emoji: 😵
       */
      "DIZZY_FACE" = "😵",
      /**
       * Emoji: 🧬
       */
      "DNA" = "🧬",
      /**
       * Emoji: 🦤
       */
      "DODO" = "🦤",
      /**
       * Emoji: 🐶
       */
      "DOG" = "🐶",
      /**
       * Emoji: 🐕
       */
      "DOG2" = "🐕",
      /**
       * Emoji: 💵
       */
      "DOLLAR" = "💵",
      /**
       * Emoji: 🎎
       */
      "DOLLS" = "🎎",
      /**
       * Emoji: 🐬
       */
      "DOLPHIN" = "🐬",
      /**
       * Emoji: 🚪
       */
      "DOOR" = "🚪",
      /**
       * Emoji: ⏸️
       *
       * Aliases: `PAUSE_BUTTON`
       */
      "DOUBLE_VERTICAL_BAR" = "⏸️",
      /**
       * Emoji: 🍩
       */
      "DOUGHNUT" = "🍩",
      /**
       * Emoji: 🕊️
       *
       * Aliases: `DOVE_OF_PEACE`
       */
      "DOVE" = "🕊️",
      /**
       * Emoji: 🕊️
       *
       * Aliases: `DOVE`
       */
      "DOVE_OF_PEACE" = "🕊️",
      /**
       * Emoji: 🚯
       */
      "DO_NOT_LITTER" = "🚯",
      /**
       * Emoji: 🐉
       */
      "DRAGON" = "🐉",
      /**
       * Emoji: 🐲
       */
      "DRAGON_FACE" = "🐲",
      /**
       * Emoji: 👗
       */
      "DRESS" = "👗",
      /**
       * Emoji: 🐪
       */
      "DROMEDARY_CAMEL" = "🐪",
      /**
       * Emoji: 🤤
       *
       * Aliases: `DROOLING_FACE`
       */
      "DROOL" = "🤤",
      /**
       * Emoji: 🤤
       *
       * Aliases: `DROOL`
       */
      "DROOLING_FACE" = "🤤",
      /**
       * Emoji: 💧
       */
      "DROPLET" = "💧",
      /**
       * Emoji: 🩸
       */
      "DROP_OF_BLOOD" = "🩸",
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
       * Emoji: 🦆
       */
      "DUCK" = "🦆",
      /**
       * Emoji: 🥟
       */
      "DUMPLING" = "🥟",
      /**
       * Emoji: 📀
       */
      "DVD" = "📀",
      /**
       * Emoji: 🦅
       */
      "EAGLE" = "🦅",
      /**
       * Emoji: 👂
       */
      "EAR" = "👂",
      /**
       * Emoji: 🌍
       */
      "EARTH_AFRICA" = "🌍",
      /**
       * Emoji: 🌎
       */
      "EARTH_AMERICAS" = "🌎",
      /**
       * Emoji: 🌏
       */
      "EARTH_ASIA" = "🌏",
      /**
       * Emoji: 🌾
       */
      "EAR_OF_RICE" = "🌾",
      /**
       * Emoji: 🦻
       */
      "EAR_WITH_HEARING_AID" = "🦻",
      /**
       * Emoji: 🥚
       */
      "EGG" = "🥚",
      /**
       * Emoji: 🍆
       */
      "EGGPLANT" = "🍆",
      /**
       * Emoji: 8️⃣
       */
      "EIGHT" = "8️⃣",
      /**
       * Emoji: ✴️
       */
      "EIGHT_POINTED_BLACK_STAR" = "✴️",
      /**
       * Emoji: ✳️
       */
      "EIGHT_SPOKED_ASTERISK" = "✳️",
      /**
       * Emoji: ⏏️
       *
       * Aliases: `EJECT_SYMBOL`
       */
      "EJECT" = "⏏️",
      /**
       * Emoji: ⏏️
       *
       * Aliases: `EJECT`
       */
      "EJECT_SYMBOL" = "⏏️",
      /**
       * Emoji: 🔌
       */
      "ELECTRIC_PLUG" = "🔌",
      /**
       * Emoji: 🐘
       */
      "ELEPHANT" = "🐘",
      /**
       * Emoji: 🛗
       */
      "ELEVATOR" = "🛗",
      /**
       * Emoji: 🧝
       */
      "ELF" = "🧝",
      /**
       * Emoji: 📧
       *
       * Aliases: `E_MAIL`
       */
      "EMAIL" = "📧",
      /**
       * Emoji: 🔚
       */
      "END" = "🔚",
      /**
       * Emoji: 🏴󠁧󠁢󠁥󠁮󠁧󠁿
       */
      "ENGLAND" = "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
      /**
       * Emoji: ✉️
       */
      "ENVELOPE" = "✉️",
      /**
       * Emoji: 📩
       */
      "ENVELOPE_WITH_ARROW" = "📩",
      /**
       * Emoji: 💶
       */
      "EURO" = "💶",
      /**
       * Emoji: 🏰
       */
      "EUROPEAN_CASTLE" = "🏰",
      /**
       * Emoji: 🏤
       */
      "EUROPEAN_POST_OFFICE" = "🏤",
      /**
       * Emoji: 🌲
       */
      "EVERGREEN_TREE" = "🌲",
      /**
       * Emoji: ❗
       */
      "EXCLAMATION" = "❗",
      /**
       * Emoji: 🤰
       *
       * Aliases: `PREGNANT_WOMAN`
       */
      "EXPECTING_WOMAN" = "🤰",
      /**
       * Emoji: 🤯
       */
      "EXPLODING_HEAD" = "🤯",
      /**
       * Emoji: 😑
       */
      "EXPRESSIONLESS" = "😑",
      /**
       * Emoji: 👁️
       */
      "EYE" = "👁️",
      /**
       * Emoji: 👓
       */
      "EYEGLASSES" = "👓",
      /**
       * Emoji: 👀
       */
      "EYES" = "👀",
      /**
       * Emoji: 👁‍🗨
       */
      "EYE_IN_SPEECH_BUBBLE" = "👁‍🗨",
      /**
       * Emoji: 📧
       *
       * Aliases: `EMAIL`
       */
      "E_MAIL" = "📧",
      /**
       * Emoji: 🤦
       *
       * Aliases: `PERSON_FACEPALMING`,`FACE_PALM`
       */
      "FACEPALM" = "🤦",
      /**
       * Emoji: 🤦
       *
       * Aliases: `PERSON_FACEPALMING`,`FACEPALM`
       */
      "FACE_PALM" = "🤦",
      /**
       * Emoji: 🤮
       */
      "FACE_VOMITING" = "🤮",
      /**
       * Emoji: 🤠
       *
       * Aliases: `COWBOY`
       */
      "FACE_WITH_COWBOY_HAT" = "🤠",
      /**
       * Emoji: 🤭
       */
      "FACE_WITH_HAND_OVER_MOUTH" = "🤭",
      /**
       * Emoji: 🤕
       *
       * Aliases: `HEAD_BANDAGE`
       */
      "FACE_WITH_HEAD_BANDAGE" = "🤕",
      /**
       * Emoji: 🧐
       */
      "FACE_WITH_MONOCLE" = "🧐",
      /**
       * Emoji: 🤨
       */
      "FACE_WITH_RAISED_EYEBROW" = "🤨",
      /**
       * Emoji: 🙄
       *
       * Aliases: `ROLLING_EYES`
       */
      "FACE_WITH_ROLLING_EYES" = "🙄",
      /**
       * Emoji: 🤬
       */
      "FACE_WITH_SYMBOLS_OVER_MOUTH" = "🤬",
      /**
       * Emoji: 🤒
       *
       * Aliases: `THERMOMETER_FACE`
       */
      "FACE_WITH_THERMOMETER" = "🤒",
      /**
       * Emoji: 🏭
       */
      "FACTORY" = "🏭",
      /**
       * Emoji: 🧑‍🏭
       */
      "FACTORY_WORKER" = "🧑‍🏭",
      /**
       * Emoji: 🧚
       */
      "FAIRY" = "🧚",
      /**
       * Emoji: 🧆
       */
      "FALAFEL" = "🧆",
      /**
       * Emoji: 🍂
       */
      "FALLEN_LEAF" = "🍂",
      /**
       * Emoji: 👪
       */
      "FAMILY" = "👪",
      /**
       * Emoji: 👨‍👦
       */
      "FAMILY_MAN_BOY" = "👨‍👦",
      /**
       * Emoji: 👨‍👦‍👦
       */
      "FAMILY_MAN_BOY_BOY" = "👨‍👦‍👦",
      /**
       * Emoji: 👨‍👧
       */
      "FAMILY_MAN_GIRL" = "👨‍👧",
      /**
       * Emoji: 👨‍👧‍👦
       */
      "FAMILY_MAN_GIRL_BOY" = "👨‍👧‍👦",
      /**
       * Emoji: 👨‍👧‍👧
       */
      "FAMILY_MAN_GIRL_GIRL" = "👨‍👧‍👧",
      /**
       * Emoji: 👨‍👩‍👦
       */
      "FAMILY_MAN_WOMAN_BOY" = "👨‍👩‍👦",
      /**
       * Emoji: 👨‍👨‍👦
       */
      "FAMILY_MMB" = "👨‍👨‍👦",
      /**
       * Emoji: 👨‍👨‍👦‍👦
       */
      "FAMILY_MMBB" = "👨‍👨‍👦‍👦",
      /**
       * Emoji: 👨‍👨‍👧
       */
      "FAMILY_MMG" = "👨‍👨‍👧",
      /**
       * Emoji: 👨‍👨‍👧‍👦
       */
      "FAMILY_MMGB" = "👨‍👨‍👧‍👦",
      /**
       * Emoji: 👨‍👨‍👧‍👧
       */
      "FAMILY_MMGG" = "👨‍👨‍👧‍👧",
      /**
       * Emoji: 👨‍👩‍👦‍👦
       */
      "FAMILY_MWBB" = "👨‍👩‍👦‍👦",
      /**
       * Emoji: 👨‍👩‍👧
       */
      "FAMILY_MWG" = "👨‍👩‍👧",
      /**
       * Emoji: 👨‍👩‍👧‍👦
       */
      "FAMILY_MWGB" = "👨‍👩‍👧‍👦",
      /**
       * Emoji: 👨‍👩‍👧‍👧
       */
      "FAMILY_MWGG" = "👨‍👩‍👧‍👧",
      /**
       * Emoji: 👩‍👦
       */
      "FAMILY_WOMAN_BOY" = "👩‍👦",
      /**
       * Emoji: 👩‍👦‍👦
       */
      "FAMILY_WOMAN_BOY_BOY" = "👩‍👦‍👦",
      /**
       * Emoji: 👩‍👧
       */
      "FAMILY_WOMAN_GIRL" = "👩‍👧",
      /**
       * Emoji: 👩‍👧‍👦
       */
      "FAMILY_WOMAN_GIRL_BOY" = "👩‍👧‍👦",
      /**
       * Emoji: 👩‍👧‍👧
       */
      "FAMILY_WOMAN_GIRL_GIRL" = "👩‍👧‍👧",
      /**
       * Emoji: 👩‍👩‍👦
       */
      "FAMILY_WWB" = "👩‍👩‍👦",
      /**
       * Emoji: 👩‍👩‍👦‍👦
       */
      "FAMILY_WWBB" = "👩‍👩‍👦‍👦",
      /**
       * Emoji: 👩‍👩‍👧
       */
      "FAMILY_WWG" = "👩‍👩‍👧",
      /**
       * Emoji: 👩‍👩‍👧‍👦
       */
      "FAMILY_WWGB" = "👩‍👩‍👧‍👦",
      /**
       * Emoji: 👩‍👩‍👧‍👧
       */
      "FAMILY_WWGG" = "👩‍👩‍👧‍👧",
      /**
       * Emoji: 🧑‍🌾
       */
      "FARMER" = "🧑‍🌾",
      /**
       * Emoji: ⏩
       */
      "FAST_FORWARD" = "⏩",
      /**
       * Emoji: 📠
       */
      "FAX" = "📠",
      /**
       * Emoji: 😨
       */
      "FEARFUL" = "😨",
      /**
       * Emoji: 🪶
       */
      "FEATHER" = "🪶",
      /**
       * Emoji: 🐾
       *
       * Aliases: `PAW_PRINTS`
       */
      "FEET" = "🐾",
      /**
       * Emoji: ♀️
       */
      "FEMALE_SIGN" = "♀️",
      /**
       * Emoji: 🤺
       *
       * Aliases: `PERSON_FENCING`,`FENCING`
       */
      "FENCER" = "🤺",
      /**
       * Emoji: 🤺
       *
       * Aliases: `PERSON_FENCING`,`FENCER`
       */
      "FENCING" = "🤺",
      /**
       * Emoji: 🎡
       */
      "FERRIS_WHEEL" = "🎡",
      /**
       * Emoji: ⛴️
       */
      "FERRY" = "⛴️",
      /**
       * Emoji: 🏑
       */
      "FIELD_HOCKEY" = "🏑",
      /**
       * Emoji: 🗄️
       */
      "FILE_CABINET" = "🗄️",
      /**
       * Emoji: 📁
       */
      "FILE_FOLDER" = "📁",
      /**
       * Emoji: 🎞️
       */
      "FILM_FRAMES" = "🎞️",
      /**
       * Emoji: 📽️
       *
       * Aliases: `PROJECTOR`
       */
      "FILM_PROJECTOR" = "📽️",
      /**
       * Emoji: 🤞
       *
       * Aliases: `HAND_WITH_INDEX_AND_MIDDLE_FINGER_CROSSED`
       */
      "FINGERS_CROSSED" = "🤞",
      /**
       * Emoji: 🔥
       *
       * Aliases: `FLAME`
       */
      "FIRE" = "🔥",
      /**
       * Emoji: 🧨
       */
      "FIRECRACKER" = "🧨",
      /**
       * Emoji: 🧑‍🚒
       */
      "FIREFIGHTER" = "🧑‍🚒",
      /**
       * Emoji: 🎆
       */
      "FIREWORKS" = "🎆",
      /**
       * Emoji: 🚒
       */
      "FIRE_ENGINE" = "🚒",
      /**
       * Emoji: 🧯
       */
      "FIRE_EXTINGUISHER" = "🧯",
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
       * Emoji: 🌓
       */
      "FIRST_QUARTER_MOON" = "🌓",
      /**
       * Emoji: 🌛
       */
      "FIRST_QUARTER_MOON_WITH_FACE" = "🌛",
      /**
       * Emoji: 🐟
       */
      "FISH" = "🐟",
      /**
       * Emoji: 🎣
       */
      "FISHING_POLE_AND_FISH" = "🎣",
      /**
       * Emoji: 🍥
       */
      "FISH_CAKE" = "🍥",
      /**
       * Emoji: ✊
       */
      "FIST" = "✊",
      /**
       * Emoji: 5️⃣
       */
      "FIVE" = "5️⃣",
      /**
       * Emoji: 🎏
       */
      "FLAGS" = "🎏",
      /**
       * Emoji: 🇦🇨
       */
      "FLAG_AC" = "🇦🇨",
      /**
       * Emoji: 🇦🇩
       */
      "FLAG_AD" = "🇦🇩",
      /**
       * Emoji: 🇦🇪
       */
      "FLAG_AE" = "🇦🇪",
      /**
       * Emoji: 🇦🇫
       */
      "FLAG_AF" = "🇦🇫",
      /**
       * Emoji: 🇦🇬
       */
      "FLAG_AG" = "🇦🇬",
      /**
       * Emoji: 🇦🇮
       */
      "FLAG_AI" = "🇦🇮",
      /**
       * Emoji: 🇦🇱
       */
      "FLAG_AL" = "🇦🇱",
      /**
       * Emoji: 🇦🇲
       */
      "FLAG_AM" = "🇦🇲",
      /**
       * Emoji: 🇦🇴
       */
      "FLAG_AO" = "🇦🇴",
      /**
       * Emoji: 🇦🇶
       */
      "FLAG_AQ" = "🇦🇶",
      /**
       * Emoji: 🇦🇷
       */
      "FLAG_AR" = "🇦🇷",
      /**
       * Emoji: 🇦🇸
       */
      "FLAG_AS" = "🇦🇸",
      /**
       * Emoji: 🇦🇹
       */
      "FLAG_AT" = "🇦🇹",
      /**
       * Emoji: 🇦🇺
       */
      "FLAG_AU" = "🇦🇺",
      /**
       * Emoji: 🇦🇼
       */
      "FLAG_AW" = "🇦🇼",
      /**
       * Emoji: 🇦🇽
       */
      "FLAG_AX" = "🇦🇽",
      /**
       * Emoji: 🇦🇿
       */
      "FLAG_AZ" = "🇦🇿",
      /**
       * Emoji: 🇧🇦
       */
      "FLAG_BA" = "🇧🇦",
      /**
       * Emoji: 🇧🇧
       */
      "FLAG_BB" = "🇧🇧",
      /**
       * Emoji: 🇧🇩
       */
      "FLAG_BD" = "🇧🇩",
      /**
       * Emoji: 🇧🇪
       */
      "FLAG_BE" = "🇧🇪",
      /**
       * Emoji: 🇧🇫
       */
      "FLAG_BF" = "🇧🇫",
      /**
       * Emoji: 🇧🇬
       */
      "FLAG_BG" = "🇧🇬",
      /**
       * Emoji: 🇧🇭
       */
      "FLAG_BH" = "🇧🇭",
      /**
       * Emoji: 🇧🇮
       */
      "FLAG_BI" = "🇧🇮",
      /**
       * Emoji: 🇧🇯
       */
      "FLAG_BJ" = "🇧🇯",
      /**
       * Emoji: 🇧🇱
       */
      "FLAG_BL" = "🇧🇱",
      /**
       * Emoji: 🏴
       */
      "FLAG_BLACK" = "🏴",
      /**
       * Emoji: 🇧🇲
       */
      "FLAG_BM" = "🇧🇲",
      /**
       * Emoji: 🇧🇳
       */
      "FLAG_BN" = "🇧🇳",
      /**
       * Emoji: 🇧🇴
       */
      "FLAG_BO" = "🇧🇴",
      /**
       * Emoji: 🇧🇶
       */
      "FLAG_BQ" = "🇧🇶",
      /**
       * Emoji: 🇧🇷
       */
      "FLAG_BR" = "🇧🇷",
      /**
       * Emoji: 🇧🇸
       */
      "FLAG_BS" = "🇧🇸",
      /**
       * Emoji: 🇧🇹
       */
      "FLAG_BT" = "🇧🇹",
      /**
       * Emoji: 🇧🇻
       */
      "FLAG_BV" = "🇧🇻",
      /**
       * Emoji: 🇧🇼
       */
      "FLAG_BW" = "🇧🇼",
      /**
       * Emoji: 🇧🇾
       */
      "FLAG_BY" = "🇧🇾",
      /**
       * Emoji: 🇧🇿
       */
      "FLAG_BZ" = "🇧🇿",
      /**
       * Emoji: 🇨🇦
       */
      "FLAG_CA" = "🇨🇦",
      /**
       * Emoji: 🇨🇨
       */
      "FLAG_CC" = "🇨🇨",
      /**
       * Emoji: 🇨🇩
       */
      "FLAG_CD" = "🇨🇩",
      /**
       * Emoji: 🇨🇫
       */
      "FLAG_CF" = "🇨🇫",
      /**
       * Emoji: 🇨🇬
       */
      "FLAG_CG" = "🇨🇬",
      /**
       * Emoji: 🇨🇭
       */
      "FLAG_CH" = "🇨🇭",
      /**
       * Emoji: 🇨🇮
       */
      "FLAG_CI" = "🇨🇮",
      /**
       * Emoji: 🇨🇰
       */
      "FLAG_CK" = "🇨🇰",
      /**
       * Emoji: 🇨🇱
       */
      "FLAG_CL" = "🇨🇱",
      /**
       * Emoji: 🇨🇲
       */
      "FLAG_CM" = "🇨🇲",
      /**
       * Emoji: 🇨🇳
       */
      "FLAG_CN" = "🇨🇳",
      /**
       * Emoji: 🇨🇴
       */
      "FLAG_CO" = "🇨🇴",
      /**
       * Emoji: 🇨🇵
       */
      "FLAG_CP" = "🇨🇵",
      /**
       * Emoji: 🇨🇷
       */
      "FLAG_CR" = "🇨🇷",
      /**
       * Emoji: 🇨🇺
       */
      "FLAG_CU" = "🇨🇺",
      /**
       * Emoji: 🇨🇻
       */
      "FLAG_CV" = "🇨🇻",
      /**
       * Emoji: 🇨🇼
       */
      "FLAG_CW" = "🇨🇼",
      /**
       * Emoji: 🇨🇽
       */
      "FLAG_CX" = "🇨🇽",
      /**
       * Emoji: 🇨🇾
       */
      "FLAG_CY" = "🇨🇾",
      /**
       * Emoji: 🇨🇿
       */
      "FLAG_CZ" = "🇨🇿",
      /**
       * Emoji: 🇩🇪
       */
      "FLAG_DE" = "🇩🇪",
      /**
       * Emoji: 🇩🇬
       */
      "FLAG_DG" = "🇩🇬",
      /**
       * Emoji: 🇩🇯
       */
      "FLAG_DJ" = "🇩🇯",
      /**
       * Emoji: 🇩🇰
       */
      "FLAG_DK" = "🇩🇰",
      /**
       * Emoji: 🇩🇲
       */
      "FLAG_DM" = "🇩🇲",
      /**
       * Emoji: 🇩🇴
       */
      "FLAG_DO" = "🇩🇴",
      /**
       * Emoji: 🇩🇿
       */
      "FLAG_DZ" = "🇩🇿",
      /**
       * Emoji: 🇪🇦
       */
      "FLAG_EA" = "🇪🇦",
      /**
       * Emoji: 🇪🇨
       */
      "FLAG_EC" = "🇪🇨",
      /**
       * Emoji: 🇪🇪
       */
      "FLAG_EE" = "🇪🇪",
      /**
       * Emoji: 🇪🇬
       */
      "FLAG_EG" = "🇪🇬",
      /**
       * Emoji: 🇪🇭
       */
      "FLAG_EH" = "🇪🇭",
      /**
       * Emoji: 🇪🇷
       */
      "FLAG_ER" = "🇪🇷",
      /**
       * Emoji: 🇪🇸
       */
      "FLAG_ES" = "🇪🇸",
      /**
       * Emoji: 🇪🇹
       */
      "FLAG_ET" = "🇪🇹",
      /**
       * Emoji: 🇪🇺
       */
      "FLAG_EU" = "🇪🇺",
      /**
       * Emoji: 🇫🇮
       */
      "FLAG_FI" = "🇫🇮",
      /**
       * Emoji: 🇫🇯
       */
      "FLAG_FJ" = "🇫🇯",
      /**
       * Emoji: 🇫🇰
       */
      "FLAG_FK" = "🇫🇰",
      /**
       * Emoji: 🇫🇲
       */
      "FLAG_FM" = "🇫🇲",
      /**
       * Emoji: 🇫🇴
       */
      "FLAG_FO" = "🇫🇴",
      /**
       * Emoji: 🇫🇷
       */
      "FLAG_FR" = "🇫🇷",
      /**
       * Emoji: 🇬🇦
       */
      "FLAG_GA" = "🇬🇦",
      /**
       * Emoji: 🇬🇧
       */
      "FLAG_GB" = "🇬🇧",
      /**
       * Emoji: 🇬🇩
       */
      "FLAG_GD" = "🇬🇩",
      /**
       * Emoji: 🇬🇪
       */
      "FLAG_GE" = "🇬🇪",
      /**
       * Emoji: 🇬🇫
       */
      "FLAG_GF" = "🇬🇫",
      /**
       * Emoji: 🇬🇬
       */
      "FLAG_GG" = "🇬🇬",
      /**
       * Emoji: 🇬🇭
       */
      "FLAG_GH" = "🇬🇭",
      /**
       * Emoji: 🇬🇮
       */
      "FLAG_GI" = "🇬🇮",
      /**
       * Emoji: 🇬🇱
       */
      "FLAG_GL" = "🇬🇱",
      /**
       * Emoji: 🇬🇲
       */
      "FLAG_GM" = "🇬🇲",
      /**
       * Emoji: 🇬🇳
       */
      "FLAG_GN" = "🇬🇳",
      /**
       * Emoji: 🇬🇵
       */
      "FLAG_GP" = "🇬🇵",
      /**
       * Emoji: 🇬🇶
       */
      "FLAG_GQ" = "🇬🇶",
      /**
       * Emoji: 🇬🇷
       */
      "FLAG_GR" = "🇬🇷",
      /**
       * Emoji: 🇬🇸
       */
      "FLAG_GS" = "🇬🇸",
      /**
       * Emoji: 🇬🇹
       */
      "FLAG_GT" = "🇬🇹",
      /**
       * Emoji: 🇬🇺
       */
      "FLAG_GU" = "🇬🇺",
      /**
       * Emoji: 🇬🇼
       */
      "FLAG_GW" = "🇬🇼",
      /**
       * Emoji: 🇬🇾
       */
      "FLAG_GY" = "🇬🇾",
      /**
       * Emoji: 🇭🇰
       */
      "FLAG_HK" = "🇭🇰",
      /**
       * Emoji: 🇭🇲
       */
      "FLAG_HM" = "🇭🇲",
      /**
       * Emoji: 🇭🇳
       */
      "FLAG_HN" = "🇭🇳",
      /**
       * Emoji: 🇭🇷
       */
      "FLAG_HR" = "🇭🇷",
      /**
       * Emoji: 🇭🇹
       */
      "FLAG_HT" = "🇭🇹",
      /**
       * Emoji: 🇭🇺
       */
      "FLAG_HU" = "🇭🇺",
      /**
       * Emoji: 🇮🇨
       */
      "FLAG_IC" = "🇮🇨",
      /**
       * Emoji: 🇮🇩
       */
      "FLAG_ID" = "🇮🇩",
      /**
       * Emoji: 🇮🇪
       */
      "FLAG_IE" = "🇮🇪",
      /**
       * Emoji: 🇮🇱
       */
      "FLAG_IL" = "🇮🇱",
      /**
       * Emoji: 🇮🇲
       */
      "FLAG_IM" = "🇮🇲",
      /**
       * Emoji: 🇮🇳
       */
      "FLAG_IN" = "🇮🇳",
      /**
       * Emoji: 🇮🇴
       */
      "FLAG_IO" = "🇮🇴",
      /**
       * Emoji: 🇮🇶
       */
      "FLAG_IQ" = "🇮🇶",
      /**
       * Emoji: 🇮🇷
       */
      "FLAG_IR" = "🇮🇷",
      /**
       * Emoji: 🇮🇸
       */
      "FLAG_IS" = "🇮🇸",
      /**
       * Emoji: 🇮🇹
       */
      "FLAG_IT" = "🇮🇹",
      /**
       * Emoji: 🇯🇪
       */
      "FLAG_JE" = "🇯🇪",
      /**
       * Emoji: 🇯🇲
       */
      "FLAG_JM" = "🇯🇲",
      /**
       * Emoji: 🇯🇴
       */
      "FLAG_JO" = "🇯🇴",
      /**
       * Emoji: 🇯🇵
       */
      "FLAG_JP" = "🇯🇵",
      /**
       * Emoji: 🇰🇪
       */
      "FLAG_KE" = "🇰🇪",
      /**
       * Emoji: 🇰🇬
       */
      "FLAG_KG" = "🇰🇬",
      /**
       * Emoji: 🇰🇭
       */
      "FLAG_KH" = "🇰🇭",
      /**
       * Emoji: 🇰🇮
       */
      "FLAG_KI" = "🇰🇮",
      /**
       * Emoji: 🇰🇲
       */
      "FLAG_KM" = "🇰🇲",
      /**
       * Emoji: 🇰🇳
       */
      "FLAG_KN" = "🇰🇳",
      /**
       * Emoji: 🇰🇵
       */
      "FLAG_KP" = "🇰🇵",
      /**
       * Emoji: 🇰🇷
       */
      "FLAG_KR" = "🇰🇷",
      /**
       * Emoji: 🇰🇼
       */
      "FLAG_KW" = "🇰🇼",
      /**
       * Emoji: 🇰🇾
       */
      "FLAG_KY" = "🇰🇾",
      /**
       * Emoji: 🇰🇿
       */
      "FLAG_KZ" = "🇰🇿",
      /**
       * Emoji: 🇱🇦
       */
      "FLAG_LA" = "🇱🇦",
      /**
       * Emoji: 🇱🇧
       */
      "FLAG_LB" = "🇱🇧",
      /**
       * Emoji: 🇱🇨
       */
      "FLAG_LC" = "🇱🇨",
      /**
       * Emoji: 🇱🇮
       */
      "FLAG_LI" = "🇱🇮",
      /**
       * Emoji: 🇱🇰
       */
      "FLAG_LK" = "🇱🇰",
      /**
       * Emoji: 🇱🇷
       */
      "FLAG_LR" = "🇱🇷",
      /**
       * Emoji: 🇱🇸
       */
      "FLAG_LS" = "🇱🇸",
      /**
       * Emoji: 🇱🇹
       */
      "FLAG_LT" = "🇱🇹",
      /**
       * Emoji: 🇱🇺
       */
      "FLAG_LU" = "🇱🇺",
      /**
       * Emoji: 🇱🇻
       */
      "FLAG_LV" = "🇱🇻",
      /**
       * Emoji: 🇱🇾
       */
      "FLAG_LY" = "🇱🇾",
      /**
       * Emoji: 🇲🇦
       */
      "FLAG_MA" = "🇲🇦",
      /**
       * Emoji: 🇲🇨
       */
      "FLAG_MC" = "🇲🇨",
      /**
       * Emoji: 🇲🇩
       */
      "FLAG_MD" = "🇲🇩",
      /**
       * Emoji: 🇲🇪
       */
      "FLAG_ME" = "🇲🇪",
      /**
       * Emoji: 🇲🇫
       */
      "FLAG_MF" = "🇲🇫",
      /**
       * Emoji: 🇲🇬
       */
      "FLAG_MG" = "🇲🇬",
      /**
       * Emoji: 🇲🇭
       */
      "FLAG_MH" = "🇲🇭",
      /**
       * Emoji: 🇲🇰
       */
      "FLAG_MK" = "🇲🇰",
      /**
       * Emoji: 🇲🇱
       */
      "FLAG_ML" = "🇲🇱",
      /**
       * Emoji: 🇲🇲
       */
      "FLAG_MM" = "🇲🇲",
      /**
       * Emoji: 🇲🇳
       */
      "FLAG_MN" = "🇲🇳",
      /**
       * Emoji: 🇲🇴
       */
      "FLAG_MO" = "🇲🇴",
      /**
       * Emoji: 🇲🇵
       */
      "FLAG_MP" = "🇲🇵",
      /**
       * Emoji: 🇲🇶
       */
      "FLAG_MQ" = "🇲🇶",
      /**
       * Emoji: 🇲🇷
       */
      "FLAG_MR" = "🇲🇷",
      /**
       * Emoji: 🇲🇸
       */
      "FLAG_MS" = "🇲🇸",
      /**
       * Emoji: 🇲🇹
       */
      "FLAG_MT" = "🇲🇹",
      /**
       * Emoji: 🇲🇺
       */
      "FLAG_MU" = "🇲🇺",
      /**
       * Emoji: 🇲🇻
       */
      "FLAG_MV" = "🇲🇻",
      /**
       * Emoji: 🇲🇼
       */
      "FLAG_MW" = "🇲🇼",
      /**
       * Emoji: 🇲🇽
       */
      "FLAG_MX" = "🇲🇽",
      /**
       * Emoji: 🇲🇾
       */
      "FLAG_MY" = "🇲🇾",
      /**
       * Emoji: 🇲🇿
       */
      "FLAG_MZ" = "🇲🇿",
      /**
       * Emoji: 🇳🇦
       */
      "FLAG_NA" = "🇳🇦",
      /**
       * Emoji: 🇳🇨
       */
      "FLAG_NC" = "🇳🇨",
      /**
       * Emoji: 🇳🇪
       */
      "FLAG_NE" = "🇳🇪",
      /**
       * Emoji: 🇳🇫
       */
      "FLAG_NF" = "🇳🇫",
      /**
       * Emoji: 🇳🇬
       */
      "FLAG_NG" = "🇳🇬",
      /**
       * Emoji: 🇳🇮
       */
      "FLAG_NI" = "🇳🇮",
      /**
       * Emoji: 🇳🇱
       */
      "FLAG_NL" = "🇳🇱",
      /**
       * Emoji: 🇳🇴
       */
      "FLAG_NO" = "🇳🇴",
      /**
       * Emoji: 🇳🇵
       */
      "FLAG_NP" = "🇳🇵",
      /**
       * Emoji: 🇳🇷
       */
      "FLAG_NR" = "🇳🇷",
      /**
       * Emoji: 🇳🇺
       */
      "FLAG_NU" = "🇳🇺",
      /**
       * Emoji: 🇳🇿
       */
      "FLAG_NZ" = "🇳🇿",
      /**
       * Emoji: 🇴🇲
       */
      "FLAG_OM" = "🇴🇲",
      /**
       * Emoji: 🇵🇦
       */
      "FLAG_PA" = "🇵🇦",
      /**
       * Emoji: 🇵🇪
       */
      "FLAG_PE" = "🇵🇪",
      /**
       * Emoji: 🇵🇫
       */
      "FLAG_PF" = "🇵🇫",
      /**
       * Emoji: 🇵🇬
       */
      "FLAG_PG" = "🇵🇬",
      /**
       * Emoji: 🇵🇭
       */
      "FLAG_PH" = "🇵🇭",
      /**
       * Emoji: 🇵🇰
       */
      "FLAG_PK" = "🇵🇰",
      /**
       * Emoji: 🇵🇱
       */
      "FLAG_PL" = "🇵🇱",
      /**
       * Emoji: 🇵🇲
       */
      "FLAG_PM" = "🇵🇲",
      /**
       * Emoji: 🇵🇳
       */
      "FLAG_PN" = "🇵🇳",
      /**
       * Emoji: 🇵🇷
       */
      "FLAG_PR" = "🇵🇷",
      /**
       * Emoji: 🇵🇸
       */
      "FLAG_PS" = "🇵🇸",
      /**
       * Emoji: 🇵🇹
       */
      "FLAG_PT" = "🇵🇹",
      /**
       * Emoji: 🇵🇼
       */
      "FLAG_PW" = "🇵🇼",
      /**
       * Emoji: 🇵🇾
       */
      "FLAG_PY" = "🇵🇾",
      /**
       * Emoji: 🇶🇦
       */
      "FLAG_QA" = "🇶🇦",
      /**
       * Emoji: 🇷🇪
       */
      "FLAG_RE" = "🇷🇪",
      /**
       * Emoji: 🇷🇴
       */
      "FLAG_RO" = "🇷🇴",
      /**
       * Emoji: 🇷🇸
       */
      "FLAG_RS" = "🇷🇸",
      /**
       * Emoji: 🇷🇺
       */
      "FLAG_RU" = "🇷🇺",
      /**
       * Emoji: 🇷🇼
       */
      "FLAG_RW" = "🇷🇼",
      /**
       * Emoji: 🇸🇦
       */
      "FLAG_SA" = "🇸🇦",
      /**
       * Emoji: 🇸🇧
       */
      "FLAG_SB" = "🇸🇧",
      /**
       * Emoji: 🇸🇨
       */
      "FLAG_SC" = "🇸🇨",
      /**
       * Emoji: 🇸🇩
       */
      "FLAG_SD" = "🇸🇩",
      /**
       * Emoji: 🇸🇪
       */
      "FLAG_SE" = "🇸🇪",
      /**
       * Emoji: 🇸🇬
       */
      "FLAG_SG" = "🇸🇬",
      /**
       * Emoji: 🇸🇭
       */
      "FLAG_SH" = "🇸🇭",
      /**
       * Emoji: 🇸🇮
       */
      "FLAG_SI" = "🇸🇮",
      /**
       * Emoji: 🇸🇯
       */
      "FLAG_SJ" = "🇸🇯",
      /**
       * Emoji: 🇸🇰
       */
      "FLAG_SK" = "🇸🇰",
      /**
       * Emoji: 🇸🇱
       */
      "FLAG_SL" = "🇸🇱",
      /**
       * Emoji: 🇸🇲
       */
      "FLAG_SM" = "🇸🇲",
      /**
       * Emoji: 🇸🇳
       */
      "FLAG_SN" = "🇸🇳",
      /**
       * Emoji: 🇸🇴
       */
      "FLAG_SO" = "🇸🇴",
      /**
       * Emoji: 🇸🇷
       */
      "FLAG_SR" = "🇸🇷",
      /**
       * Emoji: 🇸🇸
       */
      "FLAG_SS" = "🇸🇸",
      /**
       * Emoji: 🇸🇹
       */
      "FLAG_ST" = "🇸🇹",
      /**
       * Emoji: 🇸🇻
       */
      "FLAG_SV" = "🇸🇻",
      /**
       * Emoji: 🇸🇽
       */
      "FLAG_SX" = "🇸🇽",
      /**
       * Emoji: 🇸🇾
       */
      "FLAG_SY" = "🇸🇾",
      /**
       * Emoji: 🇸🇿
       */
      "FLAG_SZ" = "🇸🇿",
      /**
       * Emoji: 🇹🇦
       */
      "FLAG_TA" = "🇹🇦",
      /**
       * Emoji: 🇹🇨
       */
      "FLAG_TC" = "🇹🇨",
      /**
       * Emoji: 🇹🇩
       */
      "FLAG_TD" = "🇹🇩",
      /**
       * Emoji: 🇹🇫
       */
      "FLAG_TF" = "🇹🇫",
      /**
       * Emoji: 🇹🇬
       */
      "FLAG_TG" = "🇹🇬",
      /**
       * Emoji: 🇹🇭
       */
      "FLAG_TH" = "🇹🇭",
      /**
       * Emoji: 🇹🇯
       */
      "FLAG_TJ" = "🇹🇯",
      /**
       * Emoji: 🇹🇰
       */
      "FLAG_TK" = "🇹🇰",
      /**
       * Emoji: 🇹🇱
       */
      "FLAG_TL" = "🇹🇱",
      /**
       * Emoji: 🇹🇲
       */
      "FLAG_TM" = "🇹🇲",
      /**
       * Emoji: 🇹🇳
       */
      "FLAG_TN" = "🇹🇳",
      /**
       * Emoji: 🇹🇴
       */
      "FLAG_TO" = "🇹🇴",
      /**
       * Emoji: 🇹🇷
       */
      "FLAG_TR" = "🇹🇷",
      /**
       * Emoji: 🇹🇹
       */
      "FLAG_TT" = "🇹🇹",
      /**
       * Emoji: 🇹🇻
       */
      "FLAG_TV" = "🇹🇻",
      /**
       * Emoji: 🇹🇼
       */
      "FLAG_TW" = "🇹🇼",
      /**
       * Emoji: 🇹🇿
       */
      "FLAG_TZ" = "🇹🇿",
      /**
       * Emoji: 🇺🇦
       */
      "FLAG_UA" = "🇺🇦",
      /**
       * Emoji: 🇺🇬
       */
      "FLAG_UG" = "🇺🇬",
      /**
       * Emoji: 🇺🇲
       */
      "FLAG_UM" = "🇺🇲",
      /**
       * Emoji: 🇺🇸
       */
      "FLAG_US" = "🇺🇸",
      /**
       * Emoji: 🇺🇾
       */
      "FLAG_UY" = "🇺🇾",
      /**
       * Emoji: 🇺🇿
       */
      "FLAG_UZ" = "🇺🇿",
      /**
       * Emoji: 🇻🇦
       */
      "FLAG_VA" = "🇻🇦",
      /**
       * Emoji: 🇻🇨
       */
      "FLAG_VC" = "🇻🇨",
      /**
       * Emoji: 🇻🇪
       */
      "FLAG_VE" = "🇻🇪",
      /**
       * Emoji: 🇻🇬
       */
      "FLAG_VG" = "🇻🇬",
      /**
       * Emoji: 🇻🇮
       */
      "FLAG_VI" = "🇻🇮",
      /**
       * Emoji: 🇻🇳
       */
      "FLAG_VN" = "🇻🇳",
      /**
       * Emoji: 🇻🇺
       */
      "FLAG_VU" = "🇻🇺",
      /**
       * Emoji: 🇼🇫
       */
      "FLAG_WF" = "🇼🇫",
      /**
       * Emoji: 🏳️
       */
      "FLAG_WHITE" = "🏳️",
      /**
       * Emoji: 🇼🇸
       */
      "FLAG_WS" = "🇼🇸",
      /**
       * Emoji: 🇽🇰
       */
      "FLAG_XK" = "🇽🇰",
      /**
       * Emoji: 🇾🇪
       */
      "FLAG_YE" = "🇾🇪",
      /**
       * Emoji: 🇾🇹
       */
      "FLAG_YT" = "🇾🇹",
      /**
       * Emoji: 🇿🇦
       */
      "FLAG_ZA" = "🇿🇦",
      /**
       * Emoji: 🇿🇲
       */
      "FLAG_ZM" = "🇿🇲",
      /**
       * Emoji: 🇿🇼
       */
      "FLAG_ZW" = "🇿🇼",
      /**
       * Emoji: 🔥
       *
       * Aliases: `FIRE`
       */
      "FLAME" = "🔥",
      /**
       * Emoji: 🦩
       */
      "FLAMINGO" = "🦩",
      /**
       * Emoji: 🍮
       *
       * Aliases: `CUSTARD`,`PUDDING`
       */
      "FLAN" = "🍮",
      /**
       * Emoji: 🔦
       */
      "FLASHLIGHT" = "🔦",
      /**
       * Emoji: 🫓
       */
      "FLATBREAD" = "🫓",
      /**
       * Emoji: ⚜️
       */
      "FLEUR_DE_LIS" = "⚜️",
      /**
       * Emoji: 💾
       */
      "FLOPPY_DISK" = "💾",
      /**
       * Emoji: 🎴
       */
      "FLOWER_PLAYING_CARDS" = "🎴",
      /**
       * Emoji: 😳
       */
      "FLUSHED" = "😳",
      /**
       * Emoji: 🪰
       */
      "FLY" = "🪰",
      /**
       * Emoji: 🥏
       */
      "FLYING_DISC" = "🥏",
      /**
       * Emoji: 🛸
       */
      "FLYING_SAUCER" = "🛸",
      /**
       * Emoji: 🌫️
       */
      "FOG" = "🌫️",
      /**
       * Emoji: 🌁
       */
      "FOGGY" = "🌁",
      /**
       * Emoji: 🫕
       */
      "FONDUE" = "🫕",
      /**
       * Emoji: 🦶
       */
      "FOOT" = "🦶",
      /**
       * Emoji: 🏈
       */
      "FOOTBALL" = "🏈",
      /**
       * Emoji: 👣
       */
      "FOOTPRINTS" = "👣",
      /**
       * Emoji: 🍴
       */
      "FORK_AND_KNIFE" = "🍴",
      /**
       * Emoji: 🍽️
       *
       * Aliases: `FORK_KNIFE_PLATE`
       */
      "FORK_AND_KNIFE_WITH_PLATE" = "🍽️",
      /**
       * Emoji: 🍽️
       *
       * Aliases: `FORK_AND_KNIFE_WITH_PLATE`
       */
      "FORK_KNIFE_PLATE" = "🍽️",
      /**
       * Emoji: 🥠
       */
      "FORTUNE_COOKIE" = "🥠",
      /**
       * Emoji: ⛲
       */
      "FOUNTAIN" = "⛲",
      /**
       * Emoji: 4️⃣
       */
      "FOUR" = "4️⃣",
      /**
       * Emoji: 🍀
       */
      "FOUR_LEAF_CLOVER" = "🍀",
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
       * Emoji: 🖼️
       *
       * Aliases: `FRAME_WITH_PICTURE`
       */
      "FRAME_PHOTO" = "🖼️",
      /**
       * Emoji: 🖼️
       *
       * Aliases: `FRAME_PHOTO`
       */
      "FRAME_WITH_PICTURE" = "🖼️",
      /**
       * Emoji: 🆓
       */
      "FREE" = "🆓",
      /**
       * Emoji: 🥖
       *
       * Aliases: `BAGUETTE_BREAD`
       */
      "FRENCH_BREAD" = "🥖",
      /**
       * Emoji: 🍤
       */
      "FRIED_SHRIMP" = "🍤",
      /**
       * Emoji: 🍟
       */
      "FRIES" = "🍟",
      /**
       * Emoji: 🐸
       */
      "FROG" = "🐸",
      /**
       * Emoji: 😦
       */
      "FROWNING" = "😦",
      /**
       * Emoji: ☹️
       *
       * Aliases: `WHITE_FROWNING_FACE`
       */
      "FROWNING2" = "☹️",
      /**
       * Emoji: ⛽
       */
      "FUELPUMP" = "⛽",
      /**
       * Emoji: 🌕
       */
      "FULL_MOON" = "🌕",
      /**
       * Emoji: 🌝
       */
      "FULL_MOON_WITH_FACE" = "🌝",
      /**
       * Emoji: ⚱️
       *
       * Aliases: `URN`
       */
      "FUNERAL_URN" = "⚱️",
      /**
       * Emoji: 🎲
       */
      "GAME_DIE" = "🎲",
      /**
       * Emoji: 🧄
       */
      "GARLIC" = "🧄",
      /**
       * Emoji: 🏳️‍🌈
       *
       * Aliases: `RAINBOW_FLAG`
       */
      "GAY_PRIDE_FLAG" = "🏳️‍🌈",
      /**
       * Emoji: ⚙️
       */
      "GEAR" = "⚙️",
      /**
       * Emoji: 💎
       */
      "GEM" = "💎",
      /**
       * Emoji: ♊
       */
      "GEMINI" = "♊",
      /**
       * Emoji: 🧞
       */
      "GENIE" = "🧞",
      /**
       * Emoji: 👻
       */
      "GHOST" = "👻",
      /**
       * Emoji: 🎁
       */
      "GIFT" = "🎁",
      /**
       * Emoji: 💝
       */
      "GIFT_HEART" = "💝",
      /**
       * Emoji: 🦒
       */
      "GIRAFFE" = "🦒",
      /**
       * Emoji: 👧
       */
      "GIRL" = "👧",
      /**
       * Emoji: 🥛
       *
       * Aliases: `MILK`
       */
      "GLASS_OF_MILK" = "🥛",
      /**
       * Emoji: 🌐
       */
      "GLOBE_WITH_MERIDIANS" = "🌐",
      /**
       * Emoji: 🧤
       */
      "GLOVES" = "🧤",
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
       * Emoji: 🐐
       */
      "GOAT" = "🐐",
      /**
       * Emoji: 🥽
       */
      "GOGGLES" = "🥽",
      /**
       * Emoji: ⛳
       */
      "GOLF" = "⛳",
      /**
       * Emoji: 🏌️
       *
       * Aliases: `PERSON_GOLFING`
       */
      "GOLFER" = "🏌️",
      /**
       * Emoji: 🦍
       */
      "GORILLA" = "🦍",
      /**
       * Emoji: 👵
       *
       * Aliases: `OLDER_WOMAN`
       */
      "GRANDMA" = "👵",
      /**
       * Emoji: 🍇
       */
      "GRAPES" = "🍇",
      /**
       * Emoji: 🍏
       */
      "GREEN_APPLE" = "🍏",
      /**
       * Emoji: 📗
       */
      "GREEN_BOOK" = "📗",
      /**
       * Emoji: 🟢
       */
      "GREEN_CIRCLE" = "🟢",
      /**
       * Emoji: 💚
       */
      "GREEN_HEART" = "💚",
      /**
       * Emoji: 🥗
       *
       * Aliases: `SALAD`
       */
      "GREEN_SALAD" = "🥗",
      /**
       * Emoji: 🟩
       */
      "GREEN_SQUARE" = "🟩",
      /**
       * Emoji: ❕
       */
      "GREY_EXCLAMATION" = "❕",
      /**
       * Emoji: ❔
       */
      "GREY_QUESTION" = "❔",
      /**
       * Emoji: 😬
       */
      "GRIMACING" = "😬",
      /**
       * Emoji: 😁
       */
      "GRIN" = "😁",
      /**
       * Emoji: 😀
       */
      "GRINNING" = "😀",
      /**
       * Emoji: 💂
       *
       * Aliases: `GUARDSMAN`
       */
      "GUARD" = "💂",
      /**
       * Emoji: 💂
       *
       * Aliases: `GUARD`
       */
      "GUARDSMAN" = "💂",
      /**
       * Emoji: 🦮
       */
      "GUIDE_DOG" = "🦮",
      /**
       * Emoji: 🎸
       */
      "GUITAR" = "🎸",
      /**
       * Emoji: 🔫
       */
      "GUN" = "🔫",
      /**
       * Emoji: 💇
       *
       * Aliases: `PERSON_GETTING_HAIRCUT`
       */
      "HAIRCUT" = "💇",
      /**
       * Emoji: 🍔
       */
      "HAMBURGER" = "🍔",
      /**
       * Emoji: 🔨
       */
      "HAMMER" = "🔨",
      /**
       * Emoji: ⚒️
       *
       * Aliases: `HAMMER_PICK`
       */
      "HAMMER_AND_PICK" = "⚒️",
      /**
       * Emoji: 🛠️
       *
       * Aliases: `TOOLS`
       */
      "HAMMER_AND_WRENCH" = "🛠️",
      /**
       * Emoji: ⚒️
       *
       * Aliases: `HAMMER_AND_PICK`
       */
      "HAMMER_PICK" = "⚒️",
      /**
       * Emoji: 🐹
       */
      "HAMSTER" = "🐹",
      /**
       * Emoji: 👜
       */
      "HANDBAG" = "👜",
      /**
       * Emoji: 🤾
       *
       * Aliases: `PERSON_PLAYING_HANDBALL`
       */
      "HANDBALL" = "🤾",
      /**
       * Emoji: 🤝
       *
       * Aliases: `SHAKING_HANDS`
       */
      "HANDSHAKE" = "🤝",
      /**
       * Emoji: 🖐️
       *
       * Aliases: `RAISED_HAND_WITH_FINGERS_SPLAYED`
       */
      "HAND_SPLAYED" = "🖐️",
      /**
       * Emoji: 🤞
       *
       * Aliases: `FINGERS_CROSSED`
       */
      "HAND_WITH_INDEX_AND_MIDDLE_FINGER_CROSSED" = "🤞",
      /**
       * Emoji: 💩
       *
       * Aliases: `POOP`,`SHIT`,`POO`
       */
      "HANKEY" = "💩",
      /**
       * Emoji: #️⃣
       */
      "HASH" = "#️⃣",
      /**
       * Emoji: 🐥
       */
      "HATCHED_CHICK" = "🐥",
      /**
       * Emoji: 🐣
       */
      "HATCHING_CHICK" = "🐣",
      /**
       * Emoji: 🎧
       */
      "HEADPHONES" = "🎧",
      /**
       * Emoji: 🪦
       */
      "HEADSTONE" = "🪦",
      /**
       * Emoji: 🤕
       *
       * Aliases: `FACE_WITH_HEAD_BANDAGE`
       */
      "HEAD_BANDAGE" = "🤕",
      /**
       * Emoji: 🧑‍⚕️
       */
      "HEALTH_WORKER" = "🧑‍⚕️",
      /**
       * Emoji: ❤️
       */
      "HEART" = "❤️",
      /**
       * Emoji: 💓
       */
      "HEARTBEAT" = "💓",
      /**
       * Emoji: 💗
       */
      "HEARTPULSE" = "💗",
      /**
       * Emoji: ♥️
       */
      "HEARTS" = "♥️",
      /**
       * Emoji: 💟
       */
      "HEART_DECORATION" = "💟",
      /**
       * Emoji: ❣️
       *
       * Aliases: `HEAVY_HEART_EXCLAMATION_MARK_ORNAMENT`
       */
      "HEART_EXCLAMATION" = "❣️",
      /**
       * Emoji: 😍
       */
      "HEART_EYES" = "😍",
      /**
       * Emoji: 😻
       */
      "HEART_EYES_CAT" = "😻",
      /**
       * Emoji: 🙉
       */
      "HEAR_NO_EVIL" = "🙉",
      /**
       * Emoji: ✔️
       */
      "HEAVY_CHECK_MARK" = "✔️",
      /**
       * Emoji: ➗
       */
      "HEAVY_DIVISION_SIGN" = "➗",
      /**
       * Emoji: 💲
       */
      "HEAVY_DOLLAR_SIGN" = "💲",
      /**
       * Emoji: ❣️
       *
       * Aliases: `HEART_EXCLAMATION`
       */
      "HEAVY_HEART_EXCLAMATION_MARK_ORNAMENT" = "❣️",
      /**
       * Emoji: ➖
       */
      "HEAVY_MINUS_SIGN" = "➖",
      /**
       * Emoji: ✖️
       */
      "HEAVY_MULTIPLICATION_X" = "✖️",
      /**
       * Emoji: ➕
       */
      "HEAVY_PLUS_SIGN" = "➕",
      /**
       * Emoji: 🦔
       */
      "HEDGEHOG" = "🦔",
      /**
       * Emoji: 🚁
       */
      "HELICOPTER" = "🚁",
      /**
       * Emoji: ⛑️
       *
       * Aliases: `HELMET_WITH_WHITE_CROSS`
       */
      "HELMET_WITH_CROSS" = "⛑️",
      /**
       * Emoji: ⛑️
       *
       * Aliases: `HELMET_WITH_CROSS`
       */
      "HELMET_WITH_WHITE_CROSS" = "⛑️",
      /**
       * Emoji: 🌿
       */
      "HERB" = "🌿",
      /**
       * Emoji: 🌺
       */
      "HIBISCUS" = "🌺",
      /**
       * Emoji: 🔆
       */
      "HIGH_BRIGHTNESS" = "🔆",
      /**
       * Emoji: 👠
       */
      "HIGH_HEEL" = "👠",
      /**
       * Emoji: 🥾
       */
      "HIKING_BOOT" = "🥾",
      /**
       * Emoji: 🛕
       */
      "HINDU_TEMPLE" = "🛕",
      /**
       * Emoji: 🦛
       */
      "HIPPOPOTAMUS" = "🦛",
      /**
       * Emoji: 🏒
       */
      "HOCKEY" = "🏒",
      /**
       * Emoji: 🕳️
       */
      "HOLE" = "🕳️",
      /**
       * Emoji: 🏘️
       *
       * Aliases: `HOUSE_BUILDINGS`
       */
      "HOMES" = "🏘️",
      /**
       * Emoji: 🍯
       */
      "HONEY_POT" = "🍯",
      /**
       * Emoji: 🪝
       */
      "HOOK" = "🪝",
      /**
       * Emoji: 🐴
       */
      "HORSE" = "🐴",
      /**
       * Emoji: 🏇
       */
      "HORSE_RACING" = "🏇",
      /**
       * Emoji: 🏥
       */
      "HOSPITAL" = "🏥",
      /**
       * Emoji: 🌭
       *
       * Aliases: `HOT_DOG`
       */
      "HOTDOG" = "🌭",
      /**
       * Emoji: 🏨
       */
      "HOTEL" = "🏨",
      /**
       * Emoji: ♨️
       */
      "HOTSPRINGS" = "♨️",
      /**
       * Emoji: 🌭
       *
       * Aliases: `HOTDOG`
       */
      "HOT_DOG" = "🌭",
      /**
       * Emoji: 🥵
       */
      "HOT_FACE" = "🥵",
      /**
       * Emoji: 🌶️
       */
      "HOT_PEPPER" = "🌶️",
      /**
       * Emoji: ⌛
       */
      "HOURGLASS" = "⌛",
      /**
       * Emoji: ⏳
       */
      "HOURGLASS_FLOWING_SAND" = "⏳",
      /**
       * Emoji: 🏠
       */
      "HOUSE" = "🏠",
      /**
       * Emoji: 🏚️
       *
       * Aliases: `DERELICT_HOUSE_BUILDING`
       */
      "HOUSE_ABANDONED" = "🏚️",
      /**
       * Emoji: 🏘️
       *
       * Aliases: `HOMES`
       */
      "HOUSE_BUILDINGS" = "🏘️",
      /**
       * Emoji: 🏡
       */
      "HOUSE_WITH_GARDEN" = "🏡",
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
       * Emoji: 😯
       */
      "HUSHED" = "😯",
      /**
       * Emoji: 🛖
       */
      "HUT" = "🛖",
      /**
       * Emoji: 🍦
       */
      "ICECREAM" = "🍦",
      /**
       * Emoji: 🍨
       */
      "ICE_CREAM" = "🍨",
      /**
       * Emoji: 🧊
       */
      "ICE_CUBE" = "🧊",
      /**
       * Emoji: ⛸️
       */
      "ICE_SKATE" = "⛸️",
      /**
       * Emoji: 🆔
       */
      "ID" = "🆔",
      /**
       * Emoji: 🉐
       */
      "IDEOGRAPH_ADVANTAGE" = "🉐",
      /**
       * Emoji: 👿
       */
      "IMP" = "👿",
      /**
       * Emoji: 📥
       */
      "INBOX_TRAY" = "📥",
      /**
       * Emoji: 📨
       */
      "INCOMING_ENVELOPE" = "📨",
      /**
       * Emoji: ♾️
       */
      "INFINITY" = "♾️",
      /**
       * Emoji: 💁
       *
       * Aliases: `PERSON_TIPPING_HAND`
       */
      "INFORMATION_DESK_PERSON" = "💁",
      /**
       * Emoji: ℹ️
       */
      "INFORMATION_SOURCE" = "ℹ️",
      /**
       * Emoji: 😇
       */
      "INNOCENT" = "😇",
      /**
       * Emoji: ⁉️
       */
      "INTERROBANG" = "⁉️",
      /**
       * Emoji: 📱
       *
       * Aliases: `MOBILE_PHONE`
       */
      "IPHONE" = "📱",
      /**
       * Emoji: 🏝️
       *
       * Aliases: `DESERT_ISLAND`
       */
      "ISLAND" = "🏝️",
      /**
       * Emoji: 🏮
       */
      "IZAKAYA_LANTERN" = "🏮",
      /**
       * Emoji: 🎃
       */
      "JACK_O_LANTERN" = "🎃",
      /**
       * Emoji: 🗾
       */
      "JAPAN" = "🗾",
      /**
       * Emoji: 🏯
       */
      "JAPANESE_CASTLE" = "🏯",
      /**
       * Emoji: 👺
       */
      "JAPANESE_GOBLIN" = "👺",
      /**
       * Emoji: 👹
       */
      "JAPANESE_OGRE" = "👹",
      /**
       * Emoji: 👖
       */
      "JEANS" = "👖",
      /**
       * Emoji: 🧩
       */
      "JIGSAW" = "🧩",
      /**
       * Emoji: 😂
       */
      "JOY" = "😂",
      /**
       * Emoji: 🕹️
       */
      "JOYSTICK" = "🕹️",
      /**
       * Emoji: 😹
       */
      "JOY_CAT" = "😹",
      /**
       * Emoji: 🧑‍⚖️
       */
      "JUDGE" = "🧑‍⚖️",
      /**
       * Emoji: 🤹
       *
       * Aliases: `PERSON_JUGGLING`,`JUGGLING`
       */
      "JUGGLER" = "🤹",
      /**
       * Emoji: 🤹
       *
       * Aliases: `PERSON_JUGGLING`,`JUGGLER`
       */
      "JUGGLING" = "🤹",
      /**
       * Emoji: 🕋
       */
      "KAABA" = "🕋",
      /**
       * Emoji: 🦘
       */
      "KANGAROO" = "🦘",
      /**
       * Emoji: 🥋
       *
       * Aliases: `MARTIAL_ARTS_UNIFORM`
       */
      "KARATE_UNIFORM" = "🥋",
      /**
       * Emoji: 🛶
       *
       * Aliases: `CANOE`
       */
      "KAYAK" = "🛶",
      /**
       * Emoji: 🔑
       */
      "KEY" = "🔑",
      /**
       * Emoji: 🗝️
       *
       * Aliases: `OLD_KEY`
       */
      "KEY2" = "🗝️",
      /**
       * Emoji: ⌨️
       */
      "KEYBOARD" = "⌨️",
      /**
       * Emoji: *️⃣
       *
       * Aliases: `ASTERISK`
       */
      "KEYCAP_ASTERISK" = "*️⃣",
      /**
       * Emoji: 🔟
       */
      "KEYCAP_TEN" = "🔟",
      /**
       * Emoji: 👘
       */
      "KIMONO" = "👘",
      /**
       * Emoji: 💋
       */
      "KISS" = "💋",
      /**
       * Emoji: 😗
       */
      "KISSING" = "😗",
      /**
       * Emoji: 😽
       */
      "KISSING_CAT" = "😽",
      /**
       * Emoji: 😚
       */
      "KISSING_CLOSED_EYES" = "😚",
      /**
       * Emoji: 😘
       */
      "KISSING_HEART" = "😘",
      /**
       * Emoji: 😙
       */
      "KISSING_SMILING_EYES" = "😙",
      /**
       * Emoji: 👨‍❤️‍💋‍👨
       *
       * Aliases: `COUPLEKISS_MM`
       */
      "KISS_MM" = "👨‍❤️‍💋‍👨",
      /**
       * Emoji: 👩‍❤️‍💋‍👨
       */
      "KISS_WOMAN_MAN" = "👩‍❤️‍💋‍👨",
      /**
       * Emoji: 👩‍❤️‍💋‍👩
       *
       * Aliases: `COUPLEKISS_WW`
       */
      "KISS_WW" = "👩‍❤️‍💋‍👩",
      /**
       * Emoji: 🪁
       */
      "KITE" = "🪁",
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
       * Emoji: 🔪
       */
      "KNIFE" = "🔪",
      /**
       * Emoji: 🪢
       */
      "KNOT" = "🪢",
      /**
       * Emoji: 🐨
       */
      "KOALA" = "🐨",
      /**
       * Emoji: 🈁
       */
      "KOKO" = "🈁",
      /**
       * Emoji: 🏷️
       */
      "LABEL" = "🏷️",
      /**
       * Emoji: 🥼
       */
      "LAB_COAT" = "🥼",
      /**
       * Emoji: 🥍
       */
      "LACROSSE" = "🥍",
      /**
       * Emoji: 🪜
       */
      "LADDER" = "🪜",
      /**
       * Emoji: 🐞
       */
      "LADY_BEETLE" = "🐞",
      /**
       * Emoji: 🔷
       */
      "LARGE_BLUE_DIAMOND" = "🔷",
      /**
       * Emoji: 🔶
       */
      "LARGE_ORANGE_DIAMOND" = "🔶",
      /**
       * Emoji: 🌗
       */
      "LAST_QUARTER_MOON" = "🌗",
      /**
       * Emoji: 🌜
       */
      "LAST_QUARTER_MOON_WITH_FACE" = "🌜",
      /**
       * Emoji: ✝️
       *
       * Aliases: `CROSS`
       */
      "LATIN_CROSS" = "✝️",
      /**
       * Emoji: 😆
       *
       * Aliases: `SATISFIED`
       */
      "LAUGHING" = "😆",
      /**
       * Emoji: 🥬
       */
      "LEAFY_GREEN" = "🥬",
      /**
       * Emoji: 🍃
       */
      "LEAVES" = "🍃",
      /**
       * Emoji: 📒
       */
      "LEDGER" = "📒",
      /**
       * Emoji: ↩️
       */
      "LEFTWARDS_ARROW_WITH_HOOK" = "↩️",
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
       * Emoji: 🛅
       */
      "LEFT_LUGGAGE" = "🛅",
      /**
       * Emoji: ↔️
       */
      "LEFT_RIGHT_ARROW" = "↔️",
      /**
       * Emoji: 🗨️
       *
       * Aliases: `SPEECH_LEFT`
       */
      "LEFT_SPEECH_BUBBLE" = "🗨️",
      /**
       * Emoji: 🦵
       */
      "LEG" = "🦵",
      /**
       * Emoji: 🍋
       */
      "LEMON" = "🍋",
      /**
       * Emoji: ♌
       */
      "LEO" = "♌",
      /**
       * Emoji: 🐆
       */
      "LEOPARD" = "🐆",
      /**
       * Emoji: 🎚️
       */
      "LEVEL_SLIDER" = "🎚️",
      /**
       * Emoji: 🕴️
       *
       * Aliases: `MAN_IN_BUSINESS_SUIT_LEVITATING`
       */
      "LEVITATE" = "🕴️",
      /**
       * Emoji: 🤥
       *
       * Aliases: `LYING_FACE`
       */
      "LIAR" = "🤥",
      /**
       * Emoji: ♎
       */
      "LIBRA" = "♎",
      /**
       * Emoji: 🏋️
       *
       * Aliases: `PERSON_LIFTING_WEIGHTS`,`WEIGHT_LIFTER`
       */
      "LIFTER" = "🏋️",
      /**
       * Emoji: 🚈
       */
      "LIGHT_RAIL" = "🚈",
      /**
       * Emoji: 🔗
       */
      "LINK" = "🔗",
      /**
       * Emoji: 🖇️
       *
       * Aliases: `PAPERCLIPS`
       */
      "LINKED_PAPERCLIPS" = "🖇️",
      /**
       * Emoji: 🦁
       *
       * Aliases: `LION_FACE`
       */
      "LION" = "🦁",
      /**
       * Emoji: 🦁
       *
       * Aliases: `LION`
       */
      "LION_FACE" = "🦁",
      /**
       * Emoji: 👄
       */
      "LIPS" = "👄",
      /**
       * Emoji: 💄
       */
      "LIPSTICK" = "💄",
      /**
       * Emoji: 🦎
       */
      "LIZARD" = "🦎",
      /**
       * Emoji: 🦙
       */
      "LLAMA" = "🦙",
      /**
       * Emoji: 🦞
       */
      "LOBSTER" = "🦞",
      /**
       * Emoji: 🔒
       */
      "LOCK" = "🔒",
      /**
       * Emoji: 🔏
       */
      "LOCK_WITH_INK_PEN" = "🔏",
      /**
       * Emoji: 🍭
       */
      "LOLLIPOP" = "🍭",
      /**
       * Emoji: 🪘
       */
      "LONG_DRUM" = "🪘",
      /**
       * Emoji: ➿
       */
      "LOOP" = "➿",
      /**
       * Emoji: 📢
       */
      "LOUDSPEAKER" = "📢",
      /**
       * Emoji: 🔊
       */
      "LOUD_SOUND" = "🔊",
      /**
       * Emoji: 🏩
       */
      "LOVE_HOTEL" = "🏩",
      /**
       * Emoji: 💌
       */
      "LOVE_LETTER" = "💌",
      /**
       * Emoji: 🤟
       */
      "LOVE_YOU_GESTURE" = "🤟",
      /**
       * Emoji: 🖊️
       *
       * Aliases: `PEN_BALLPOINT`
       */
      "LOWER_LEFT_BALLPOINT_PEN" = "🖊️",
      /**
       * Emoji: 🖍️
       *
       * Aliases: `CRAYON`
       */
      "LOWER_LEFT_CRAYON" = "🖍️",
      /**
       * Emoji: 🖋️
       *
       * Aliases: `PEN_FOUNTAIN`
       */
      "LOWER_LEFT_FOUNTAIN_PEN" = "🖋️",
      /**
       * Emoji: 🖌️
       *
       * Aliases: `PAINTBRUSH`
       */
      "LOWER_LEFT_PAINTBRUSH" = "🖌️",
      /**
       * Emoji: 🔅
       */
      "LOW_BRIGHTNESS" = "🔅",
      /**
       * Emoji: 🧳
       */
      "LUGGAGE" = "🧳",
      /**
       * Emoji: 🫁
       */
      "LUNGS" = "🫁",
      /**
       * Emoji: 🤥
       *
       * Aliases: `LIAR`
       */
      "LYING_FACE" = "🤥",
      /**
       * Emoji: Ⓜ️
       */
      "M" = "Ⓜ️",
      /**
       * Emoji: 🔍
       */
      "MAG" = "🔍",
      /**
       * Emoji: 🧙
       */
      "MAGE" = "🧙",
      /**
       * Emoji: 🪄
       */
      "MAGIC_WAND" = "🪄",
      /**
       * Emoji: 🧲
       */
      "MAGNET" = "🧲",
      /**
       * Emoji: 🔎
       */
      "MAG_RIGHT" = "🔎",
      /**
       * Emoji: 🀄
       */
      "MAHJONG" = "🀄",
      /**
       * Emoji: 📫
       */
      "MAILBOX" = "📫",
      /**
       * Emoji: 📪
       */
      "MAILBOX_CLOSED" = "📪",
      /**
       * Emoji: 📬
       */
      "MAILBOX_WITH_MAIL" = "📬",
      /**
       * Emoji: 📭
       */
      "MAILBOX_WITH_NO_MAIL" = "📭",
      /**
       * Emoji: 🕺
       *
       * Aliases: `MAN_DANCING`
       */
      "MALE_DANCER" = "🕺",
      /**
       * Emoji: ♂️
       */
      "MALE_SIGN" = "♂️",
      /**
       * Emoji: 🦣
       */
      "MAMMOTH" = "🦣",
      /**
       * Emoji: 👨
       */
      "MAN" = "👨",
      /**
       * Emoji: 🥭
       */
      "MANGO" = "🥭",
      /**
       * Emoji: 👞
       */
      "MANS_SHOE" = "👞",
      /**
       * Emoji: 🕰️
       *
       * Aliases: `CLOCK`
       */
      "MANTLEPIECE_CLOCK" = "🕰️",
      /**
       * Emoji: 🦽
       */
      "MANUAL_WHEELCHAIR" = "🦽",
      /**
       * Emoji: 👨‍🎨
       */
      "MAN_ARTIST" = "👨‍🎨",
      /**
       * Emoji: 👨‍🚀
       */
      "MAN_ASTRONAUT" = "👨‍🚀",
      /**
       * Emoji: 👨‍🦲
       */
      "MAN_BALD" = "👨‍🦲",
      /**
       * Emoji: 🚴‍♂️
       */
      "MAN_BIKING" = "🚴‍♂️",
      /**
       * Emoji: ⛹️‍♂️
       */
      "MAN_BOUNCING_BALL" = "⛹️‍♂️",
      /**
       * Emoji: 🙇‍♂️
       */
      "MAN_BOWING" = "🙇‍♂️",
      /**
       * Emoji: 🤸‍♂️
       */
      "MAN_CARTWHEELING" = "🤸‍♂️",
      /**
       * Emoji: 🧗‍♂️
       */
      "MAN_CLIMBING" = "🧗‍♂️",
      /**
       * Emoji: 👷‍♂️
       */
      "MAN_CONSTRUCTION_WORKER" = "👷‍♂️",
      /**
       * Emoji: 👨‍🍳
       */
      "MAN_COOK" = "👨‍🍳",
      /**
       * Emoji: 👨‍🦱
       */
      "MAN_CURLY_HAIRED" = "👨‍🦱",
      /**
       * Emoji: 🕺
       *
       * Aliases: `MALE_DANCER`
       */
      "MAN_DANCING" = "🕺",
      /**
       * Emoji: 🕵️‍♂️
       */
      "MAN_DETECTIVE" = "🕵️‍♂️",
      /**
       * Emoji: 🧝‍♂️
       */
      "MAN_ELF" = "🧝‍♂️",
      /**
       * Emoji: 🤦‍♂️
       */
      "MAN_FACEPALMING" = "🤦‍♂️",
      /**
       * Emoji: 👨‍🏭
       */
      "MAN_FACTORY_WORKER" = "👨‍🏭",
      /**
       * Emoji: 🧚‍♂️
       */
      "MAN_FAIRY" = "🧚‍♂️",
      /**
       * Emoji: 👨‍🌾
       */
      "MAN_FARMER" = "👨‍🌾",
      /**
       * Emoji: 👨‍🍼
       */
      "MAN_FEEDING_BABY" = "👨‍🍼",
      /**
       * Emoji: 👨‍🚒
       */
      "MAN_FIREFIGHTER" = "👨‍🚒",
      /**
       * Emoji: 🙍‍♂️
       */
      "MAN_FROWNING" = "🙍‍♂️",
      /**
       * Emoji: 🧞‍♂️
       */
      "MAN_GENIE" = "🧞‍♂️",
      /**
       * Emoji: 🙅‍♂️
       */
      "MAN_GESTURING_NO" = "🙅‍♂️",
      /**
       * Emoji: 🙆‍♂️
       */
      "MAN_GESTURING_OK" = "🙆‍♂️",
      /**
       * Emoji: 💆‍♂️
       */
      "MAN_GETTING_FACE_MASSAGE" = "💆‍♂️",
      /**
       * Emoji: 💇‍♂️
       */
      "MAN_GETTING_HAIRCUT" = "💇‍♂️",
      /**
       * Emoji: 🏌️‍♂️
       */
      "MAN_GOLFING" = "🏌️‍♂️",
      /**
       * Emoji: 💂‍♂️
       */
      "MAN_GUARD" = "💂‍♂️",
      /**
       * Emoji: 👨‍⚕️
       */
      "MAN_HEALTH_WORKER" = "👨‍⚕️",
      /**
       * Emoji: 🕴️
       *
       * Aliases: `LEVITATE`
       */
      "MAN_IN_BUSINESS_SUIT_LEVITATING" = "🕴️",
      /**
       * Emoji: 🧘‍♂️
       */
      "MAN_IN_LOTUS_POSITION" = "🧘‍♂️",
      /**
       * Emoji: 👨‍🦽
       */
      "MAN_IN_MANUAL_WHEELCHAIR" = "👨‍🦽",
      /**
       * Emoji: 👨‍🦼
       */
      "MAN_IN_MOTORIZED_WHEELCHAIR" = "👨‍🦼",
      /**
       * Emoji: 🧖‍♂️
       */
      "MAN_IN_STEAMY_ROOM" = "🧖‍♂️",
      /**
       * Emoji: 🤵‍♂️
       */
      "MAN_IN_TUXEDO" = "🤵‍♂️",
      /**
       * Emoji: 👨‍⚖️
       */
      "MAN_JUDGE" = "👨‍⚖️",
      /**
       * Emoji: 🤹‍♂️
       */
      "MAN_JUGGLING" = "🤹‍♂️",
      /**
       * Emoji: 🧎‍♂️
       */
      "MAN_KNEELING" = "🧎‍♂️",
      /**
       * Emoji: 🏋️‍♂️
       */
      "MAN_LIFTING_WEIGHTS" = "🏋️‍♂️",
      /**
       * Emoji: 🧙‍♂️
       */
      "MAN_MAGE" = "🧙‍♂️",
      /**
       * Emoji: 👨‍🔧
       */
      "MAN_MECHANIC" = "👨‍🔧",
      /**
       * Emoji: 🚵‍♂️
       */
      "MAN_MOUNTAIN_BIKING" = "🚵‍♂️",
      /**
       * Emoji: 👨‍💼
       */
      "MAN_OFFICE_WORKER" = "👨‍💼",
      /**
       * Emoji: 👨‍✈️
       */
      "MAN_PILOT" = "👨‍✈️",
      /**
       * Emoji: 🤾‍♂️
       */
      "MAN_PLAYING_HANDBALL" = "🤾‍♂️",
      /**
       * Emoji: 🤽‍♂️
       */
      "MAN_PLAYING_WATER_POLO" = "🤽‍♂️",
      /**
       * Emoji: 👮‍♂️
       */
      "MAN_POLICE_OFFICER" = "👮‍♂️",
      /**
       * Emoji: 🙎‍♂️
       */
      "MAN_POUTING" = "🙎‍♂️",
      /**
       * Emoji: 🙋‍♂️
       */
      "MAN_RAISING_HAND" = "🙋‍♂️",
      /**
       * Emoji: 👨‍🦰
       */
      "MAN_RED_HAIRED" = "👨‍🦰",
      /**
       * Emoji: 🚣‍♂️
       */
      "MAN_ROWING_BOAT" = "🚣‍♂️",
      /**
       * Emoji: 🏃‍♂️
       */
      "MAN_RUNNING" = "🏃‍♂️",
      /**
       * Emoji: 👨‍🔬
       */
      "MAN_SCIENTIST" = "👨‍🔬",
      /**
       * Emoji: 🤷‍♂️
       */
      "MAN_SHRUGGING" = "🤷‍♂️",
      /**
       * Emoji: 👨‍🎤
       */
      "MAN_SINGER" = "👨‍🎤",
      /**
       * Emoji: 🧍‍♂️
       */
      "MAN_STANDING" = "🧍‍♂️",
      /**
       * Emoji: 👨‍🎓
       */
      "MAN_STUDENT" = "👨‍🎓",
      /**
       * Emoji: 🦸‍♂️
       */
      "MAN_SUPERHERO" = "🦸‍♂️",
      /**
       * Emoji: 🦹‍♂️
       */
      "MAN_SUPERVILLAIN" = "🦹‍♂️",
      /**
       * Emoji: 🏄‍♂️
       */
      "MAN_SURFING" = "🏄‍♂️",
      /**
       * Emoji: 🏊‍♂️
       */
      "MAN_SWIMMING" = "🏊‍♂️",
      /**
       * Emoji: 👨‍🏫
       */
      "MAN_TEACHER" = "👨‍🏫",
      /**
       * Emoji: 👨‍💻
       */
      "MAN_TECHNOLOGIST" = "👨‍💻",
      /**
       * Emoji: 💁‍♂️
       */
      "MAN_TIPPING_HAND" = "💁‍♂️",
      /**
       * Emoji: 🧛‍♂️
       */
      "MAN_VAMPIRE" = "🧛‍♂️",
      /**
       * Emoji: 🚶‍♂️
       */
      "MAN_WALKING" = "🚶‍♂️",
      /**
       * Emoji: 👳‍♂️
       */
      "MAN_WEARING_TURBAN" = "👳‍♂️",
      /**
       * Emoji: 👨‍🦳
       */
      "MAN_WHITE_HAIRED" = "👨‍🦳",
      /**
       * Emoji: 👲
       *
       * Aliases: `MAN_WITH_GUA_PI_MAO`
       */
      "MAN_WITH_CHINESE_CAP" = "👲",
      /**
       * Emoji: 👲
       *
       * Aliases: `MAN_WITH_CHINESE_CAP`
       */
      "MAN_WITH_GUA_PI_MAO" = "👲",
      /**
       * Emoji: 👨‍🦯
       */
      "MAN_WITH_PROBING_CANE" = "👨‍🦯",
      /**
       * Emoji: 👳
       *
       * Aliases: `PERSON_WEARING_TURBAN`
       */
      "MAN_WITH_TURBAN" = "👳",
      /**
       * Emoji: 👰‍♂️
       */
      "MAN_WITH_VEIL" = "👰‍♂️",
      /**
       * Emoji: 🧟‍♂️
       */
      "MAN_ZOMBIE" = "🧟‍♂️",
      /**
       * Emoji: 🗺️
       *
       * Aliases: `WORLD_MAP`
       */
      "MAP" = "🗺️",
      /**
       * Emoji: 🍁
       */
      "MAPLE_LEAF" = "🍁",
      /**
       * Emoji: 🥋
       *
       * Aliases: `KARATE_UNIFORM`
       */
      "MARTIAL_ARTS_UNIFORM" = "🥋",
      /**
       * Emoji: 😷
       */
      "MASK" = "😷",
      /**
       * Emoji: 💆
       *
       * Aliases: `PERSON_GETTING_MASSAGE`
       */
      "MASSAGE" = "💆",
      /**
       * Emoji: 🧉
       */
      "MATE" = "🧉",
      /**
       * Emoji: 🍖
       */
      "MEAT_ON_BONE" = "🍖",
      /**
       * Emoji: 🧑‍🔧
       */
      "MECHANIC" = "🧑‍🔧",
      /**
       * Emoji: 🦾
       */
      "MECHANICAL_ARM" = "🦾",
      /**
       * Emoji: 🦿
       */
      "MECHANICAL_LEG" = "🦿",
      /**
       * Emoji: 🏅
       *
       * Aliases: `SPORTS_MEDAL`
       */
      "MEDAL" = "🏅",
      /**
       * Emoji: ⚕️
       */
      "MEDICAL_SYMBOL" = "⚕️",
      /**
       * Emoji: 📣
       */
      "MEGA" = "📣",
      /**
       * Emoji: 🍈
       */
      "MELON" = "🍈",
      /**
       * Emoji: 📝
       *
       * Aliases: `PENCIL`
       */
      "MEMO" = "📝",
      /**
       * Emoji: 🕎
       */
      "MENORAH" = "🕎",
      /**
       * Emoji: 🚹
       */
      "MENS" = "🚹",
      /**
       * Emoji: 👯‍♂️
       */
      "MEN_WITH_BUNNY_EARS_PARTYING" = "👯‍♂️",
      /**
       * Emoji: 🤼‍♂️
       */
      "MEN_WRESTLING" = "🤼‍♂️",
      /**
       * Emoji: 🧜‍♀️
       */
      "MERMAID" = "🧜‍♀️",
      /**
       * Emoji: 🧜‍♂️
       */
      "MERMAN" = "🧜‍♂️",
      /**
       * Emoji: 🧜
       */
      "MERPERSON" = "🧜",
      /**
       * Emoji: 🤘
       *
       * Aliases: `SIGN_OF_THE_HORNS`
       */
      "METAL" = "🤘",
      /**
       * Emoji: 🚇
       */
      "METRO" = "🚇",
      /**
       * Emoji: 🦠
       */
      "MICROBE" = "🦠",
      /**
       * Emoji: 🎤
       */
      "MICROPHONE" = "🎤",
      /**
       * Emoji: 🎙️
       *
       * Aliases: `STUDIO_MICROPHONE`
       */
      "MICROPHONE2" = "🎙️",
      /**
       * Emoji: 🔬
       */
      "MICROSCOPE" = "🔬",
      /**
       * Emoji: 🖕
       *
       * Aliases: `REVERSED_HAND_WITH_MIDDLE_FINGER_EXTENDED`
       */
      "MIDDLE_FINGER" = "🖕",
      /**
       * Emoji: 🪖
       */
      "MILITARY_HELMET" = "🪖",
      /**
       * Emoji: 🎖️
       */
      "MILITARY_MEDAL" = "🎖️",
      /**
       * Emoji: 🥛
       *
       * Aliases: `GLASS_OF_MILK`
       */
      "MILK" = "🥛",
      /**
       * Emoji: 🌌
       */
      "MILKY_WAY" = "🌌",
      /**
       * Emoji: 🚐
       */
      "MINIBUS" = "🚐",
      /**
       * Emoji: 💽
       */
      "MINIDISC" = "💽",
      /**
       * Emoji: 🪞
       */
      "MIRROR" = "🪞",
      /**
       * Emoji: 📱
       *
       * Aliases: `IPHONE`
       */
      "MOBILE_PHONE" = "📱",
      /**
       * Emoji: 📴
       */
      "MOBILE_PHONE_OFF" = "📴",
      /**
       * Emoji: 💰
       */
      "MONEYBAG" = "💰",
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
       * Emoji: 💸
       */
      "MONEY_WITH_WINGS" = "💸",
      /**
       * Emoji: 🐒
       */
      "MONKEY" = "🐒",
      /**
       * Emoji: 🐵
       */
      "MONKEY_FACE" = "🐵",
      /**
       * Emoji: 🚝
       */
      "MONORAIL" = "🚝",
      /**
       * Emoji: 🥮
       */
      "MOON_CAKE" = "🥮",
      /**
       * Emoji: 🎓
       */
      "MORTAR_BOARD" = "🎓",
      /**
       * Emoji: 🕌
       */
      "MOSQUE" = "🕌",
      /**
       * Emoji: 🦟
       */
      "MOSQUITO" = "🦟",
      /**
       * Emoji: 🤶
       *
       * Aliases: `MRS_CLAUS`
       */
      "MOTHER_CHRISTMAS" = "🤶",
      /**
       * Emoji: 🛵
       *
       * Aliases: `MOTOR_SCOOTER`
       */
      "MOTORBIKE" = "🛵",
      /**
       * Emoji: 🛥️
       */
      "MOTORBOAT" = "🛥️",
      /**
       * Emoji: 🏍️
       *
       * Aliases: `RACING_MOTORCYCLE`
       */
      "MOTORCYCLE" = "🏍️",
      /**
       * Emoji: 🦼
       */
      "MOTORIZED_WHEELCHAIR" = "🦼",
      /**
       * Emoji: 🛣️
       */
      "MOTORWAY" = "🛣️",
      /**
       * Emoji: 🛵
       *
       * Aliases: `MOTORBIKE`
       */
      "MOTOR_SCOOTER" = "🛵",
      /**
       * Emoji: ⛰️
       */
      "MOUNTAIN" = "⛰️",
      /**
       * Emoji: 🚵
       *
       * Aliases: `PERSON_MOUNTAIN_BIKING`
       */
      "MOUNTAIN_BICYCLIST" = "🚵",
      /**
       * Emoji: 🚠
       */
      "MOUNTAIN_CABLEWAY" = "🚠",
      /**
       * Emoji: 🚞
       */
      "MOUNTAIN_RAILWAY" = "🚞",
      /**
       * Emoji: 🏔️
       *
       * Aliases: `SNOW_CAPPED_MOUNTAIN`
       */
      "MOUNTAIN_SNOW" = "🏔️",
      /**
       * Emoji: 🗻
       */
      "MOUNT_FUJI" = "🗻",
      /**
       * Emoji: 🐭
       */
      "MOUSE" = "🐭",
      /**
       * Emoji: 🐁
       */
      "MOUSE2" = "🐁",
      /**
       * Emoji: 🖱️
       *
       * Aliases: `THREE_BUTTON_MOUSE`
       */
      "MOUSE_THREE_BUTTON" = "🖱️",
      /**
       * Emoji: 🪤
       */
      "MOUSE_TRAP" = "🪤",
      /**
       * Emoji: 🎥
       */
      "MOVIE_CAMERA" = "🎥",
      /**
       * Emoji: 🗿
       */
      "MOYAI" = "🗿",
      /**
       * Emoji: 🤶
       *
       * Aliases: `MOTHER_CHRISTMAS`
       */
      "MRS_CLAUS" = "🤶",
      /**
       * Emoji: 💪
       */
      "MUSCLE" = "💪",
      /**
       * Emoji: 🍄
       */
      "MUSHROOM" = "🍄",
      /**
       * Emoji: 🎹
       */
      "MUSICAL_KEYBOARD" = "🎹",
      /**
       * Emoji: 🎵
       */
      "MUSICAL_NOTE" = "🎵",
      /**
       * Emoji: 🎼
       */
      "MUSICAL_SCORE" = "🎼",
      /**
       * Emoji: 🔇
       */
      "MUTE" = "🔇",
      /**
       * Emoji: 🧑‍🎄
       */
      "MX_CLAUS" = "🧑‍🎄",
      /**
       * Emoji: 💅
       */
      "NAIL_CARE" = "💅",
      /**
       * Emoji: 📛
       */
      "NAME_BADGE" = "📛",
      /**
       * Emoji: 🏞️
       *
       * Aliases: `PARK`
       */
      "NATIONAL_PARK" = "🏞️",
      /**
       * Emoji: 🤢
       *
       * Aliases: `SICK`
       */
      "NAUSEATED_FACE" = "🤢",
      /**
       * Emoji: 🧿
       */
      "NAZAR_AMULET" = "🧿",
      /**
       * Emoji: 👔
       */
      "NECKTIE" = "👔",
      /**
       * Emoji: ❎
       */
      "NEGATIVE_SQUARED_CROSS_MARK" = "❎",
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
       * Emoji: 🪆
       */
      "NESTING_DOLLS" = "🪆",
      /**
       * Emoji: 😐
       */
      "NEUTRAL_FACE" = "😐",
      /**
       * Emoji: 🆕
       */
      "NEW" = "🆕",
      /**
       * Emoji: 📰
       */
      "NEWSPAPER" = "📰",
      /**
       * Emoji: 🗞️
       *
       * Aliases: `ROLLED_UP_NEWSPAPER`
       */
      "NEWSPAPER2" = "🗞️",
      /**
       * Emoji: 🌑
       */
      "NEW_MOON" = "🌑",
      /**
       * Emoji: 🌚
       */
      "NEW_MOON_WITH_FACE" = "🌚",
      /**
       * Emoji: ⏭️
       *
       * Aliases: `TRACK_NEXT`
       */
      "NEXT_TRACK" = "⏭️",
      /**
       * Emoji: 🆖
       */
      "NG" = "🆖",
      /**
       * Emoji: 🌃
       */
      "NIGHT_WITH_STARS" = "🌃",
      /**
       * Emoji: 9️⃣
       */
      "NINE" = "9️⃣",
      /**
       * Emoji: 🥷
       */
      "NINJA" = "🥷",
      /**
       * Emoji: 🚱
       */
      "NON_POTABLE_WATER" = "🚱",
      /**
       * Emoji: 👃
       */
      "NOSE" = "👃",
      /**
       * Emoji: 📓
       */
      "NOTEBOOK" = "📓",
      /**
       * Emoji: 📔
       */
      "NOTEBOOK_WITH_DECORATIVE_COVER" = "📔",
      /**
       * Emoji: 🗒️
       *
       * Aliases: `SPIRAL_NOTE_PAD`
       */
      "NOTEPAD_SPIRAL" = "🗒️",
      /**
       * Emoji: 🎶
       */
      "NOTES" = "🎶",
      /**
       * Emoji: 🔕
       */
      "NO_BELL" = "🔕",
      /**
       * Emoji: 🚳
       */
      "NO_BICYCLES" = "🚳",
      /**
       * Emoji: ⛔
       */
      "NO_ENTRY" = "⛔",
      /**
       * Emoji: 🚫
       */
      "NO_ENTRY_SIGN" = "🚫",
      /**
       * Emoji: 🙅
       *
       * Aliases: `PERSON_GESTURING_NO`
       */
      "NO_GOOD" = "🙅",
      /**
       * Emoji: 📵
       */
      "NO_MOBILE_PHONES" = "📵",
      /**
       * Emoji: 😶
       */
      "NO_MOUTH" = "😶",
      /**
       * Emoji: 🚷
       */
      "NO_PEDESTRIANS" = "🚷",
      /**
       * Emoji: 🚭
       */
      "NO_SMOKING" = "🚭",
      /**
       * Emoji: 🔩
       */
      "NUT_AND_BOLT" = "🔩",
      /**
       * Emoji: ⭕
       */
      "O" = "⭕",
      /**
       * Emoji: 🅾️
       */
      "O2" = "🅾️",
      /**
       * Emoji: 🌊
       */
      "OCEAN" = "🌊",
      /**
       * Emoji: 🛑
       *
       * Aliases: `STOP_SIGN`
       */
      "OCTAGONAL_SIGN" = "🛑",
      /**
       * Emoji: 🐙
       */
      "OCTOPUS" = "🐙",
      /**
       * Emoji: 🍢
       */
      "ODEN" = "🍢",
      /**
       * Emoji: 🏢
       */
      "OFFICE" = "🏢",
      /**
       * Emoji: 🧑‍💼
       */
      "OFFICE_WORKER" = "🧑‍💼",
      /**
       * Emoji: 🛢️
       *
       * Aliases: `OIL_DRUM`
       */
      "OIL" = "🛢️",
      /**
       * Emoji: 🛢️
       *
       * Aliases: `OIL`
       */
      "OIL_DRUM" = "🛢️",
      /**
       * Emoji: 🆗
       */
      "OK" = "🆗",
      /**
       * Emoji: 👌
       */
      "OK_HAND" = "👌",
      /**
       * Emoji: 🙆
       *
       * Aliases: `PERSON_GESTURING_OK`
       */
      "OK_WOMAN" = "🙆",
      /**
       * Emoji: 🧓
       */
      "OLDER_ADULT" = "🧓",
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
       * Emoji: 🗝️
       *
       * Aliases: `KEY2`
       */
      "OLD_KEY" = "🗝️",
      /**
       * Emoji: 🫒
       */
      "OLIVE" = "🫒",
      /**
       * Emoji: 🕉️
       */
      "OM_SYMBOL" = "🕉️",
      /**
       * Emoji: 🔛
       */
      "ON" = "🔛",
      /**
       * Emoji: 🚘
       */
      "ONCOMING_AUTOMOBILE" = "🚘",
      /**
       * Emoji: 🚍
       */
      "ONCOMING_BUS" = "🚍",
      /**
       * Emoji: 🚔
       */
      "ONCOMING_POLICE_CAR" = "🚔",
      /**
       * Emoji: 🚖
       */
      "ONCOMING_TAXI" = "🚖",
      /**
       * Emoji: 1️⃣
       */
      "ONE" = "1️⃣",
      /**
       * Emoji: 🩱
       */
      "ONE_PIECE_SWIMSUIT" = "🩱",
      /**
       * Emoji: 🧅
       */
      "ONION" = "🧅",
      /**
       * Emoji: 📂
       */
      "OPEN_FILE_FOLDER" = "📂",
      /**
       * Emoji: 👐
       */
      "OPEN_HANDS" = "👐",
      /**
       * Emoji: 😮
       */
      "OPEN_MOUTH" = "😮",
      /**
       * Emoji: ⛎
       */
      "OPHIUCHUS" = "⛎",
      /**
       * Emoji: 📙
       */
      "ORANGE_BOOK" = "📙",
      /**
       * Emoji: 🟠
       */
      "ORANGE_CIRCLE" = "🟠",
      /**
       * Emoji: 🧡
       */
      "ORANGE_HEART" = "🧡",
      /**
       * Emoji: 🟧
       */
      "ORANGE_SQUARE" = "🟧",
      /**
       * Emoji: 🦧
       */
      "ORANGUTAN" = "🦧",
      /**
       * Emoji: ☦️
       */
      "ORTHODOX_CROSS" = "☦️",
      /**
       * Emoji: 🦦
       */
      "OTTER" = "🦦",
      /**
       * Emoji: 📤
       */
      "OUTBOX_TRAY" = "📤",
      /**
       * Emoji: 🦉
       */
      "OWL" = "🦉",
      /**
       * Emoji: 🐂
       */
      "OX" = "🐂",
      /**
       * Emoji: 🦪
       */
      "OYSTER" = "🦪",
      /**
       * Emoji: 📦
       */
      "PACKAGE" = "📦",
      /**
       * Emoji: 🥘
       *
       * Aliases: `SHALLOW_PAN_OF_FOOD`
       */
      "PAELLA" = "🥘",
      /**
       * Emoji: 📟
       */
      "PAGER" = "📟",
      /**
       * Emoji: 📄
       */
      "PAGE_FACING_UP" = "📄",
      /**
       * Emoji: 📃
       */
      "PAGE_WITH_CURL" = "📃",
      /**
       * Emoji: 🖌️
       *
       * Aliases: `LOWER_LEFT_PAINTBRUSH`
       */
      "PAINTBRUSH" = "🖌️",
      /**
       * Emoji: 🤲
       */
      "PALMS_UP_TOGETHER" = "🤲",
      /**
       * Emoji: 🌴
       */
      "PALM_TREE" = "🌴",
      /**
       * Emoji: 🥞
       */
      "PANCAKES" = "🥞",
      /**
       * Emoji: 🐼
       */
      "PANDA_FACE" = "🐼",
      /**
       * Emoji: 📎
       */
      "PAPERCLIP" = "📎",
      /**
       * Emoji: 🖇️
       *
       * Aliases: `LINKED_PAPERCLIPS`
       */
      "PAPERCLIPS" = "🖇️",
      /**
       * Emoji: 🪂
       */
      "PARACHUTE" = "🪂",
      /**
       * Emoji: 🏞️
       *
       * Aliases: `NATIONAL_PARK`
       */
      "PARK" = "🏞️",
      /**
       * Emoji: 🅿️
       */
      "PARKING" = "🅿️",
      /**
       * Emoji: 🦜
       */
      "PARROT" = "🦜",
      /**
       * Emoji: ⛅
       */
      "PARTLY_SUNNY" = "⛅",
      /**
       * Emoji: 🥳
       */
      "PARTYING_FACE" = "🥳",
      /**
       * Emoji: 〽️
       */
      "PART_ALTERNATION_MARK" = "〽️",
      /**
       * Emoji: 🛳️
       *
       * Aliases: `CRUISE_SHIP`
       */
      "PASSENGER_SHIP" = "🛳️",
      /**
       * Emoji: 🛂
       */
      "PASSPORT_CONTROL" = "🛂",
      /**
       * Emoji: ⏸️
       *
       * Aliases: `DOUBLE_VERTICAL_BAR`
       */
      "PAUSE_BUTTON" = "⏸️",
      /**
       * Emoji: 🐾
       *
       * Aliases: `FEET`
       */
      "PAW_PRINTS" = "🐾",
      /**
       * Emoji: ☮️
       *
       * Aliases: `PEACE_SYMBOL`
       */
      "PEACE" = "☮️",
      /**
       * Emoji: ☮️
       *
       * Aliases: `PEACE`
       */
      "PEACE_SYMBOL" = "☮️",
      /**
       * Emoji: 🍑
       */
      "PEACH" = "🍑",
      /**
       * Emoji: 🦚
       */
      "PEACOCK" = "🦚",
      /**
       * Emoji: 🥜
       *
       * Aliases: `SHELLED_PEANUT`
       */
      "PEANUTS" = "🥜",
      /**
       * Emoji: 🍐
       */
      "PEAR" = "🍐",
      /**
       * Emoji: 📝
       *
       * Aliases: `MEMO`
       */
      "PENCIL" = "📝",
      /**
       * Emoji: ✏️
       */
      "PENCIL2" = "✏️",
      /**
       * Emoji: 🐧
       */
      "PENGUIN" = "🐧",
      /**
       * Emoji: 😔
       */
      "PENSIVE" = "😔",
      /**
       * Emoji: 🖊️
       *
       * Aliases: `LOWER_LEFT_BALLPOINT_PEN`
       */
      "PEN_BALLPOINT" = "🖊️",
      /**
       * Emoji: 🖋️
       *
       * Aliases: `LOWER_LEFT_FOUNTAIN_PEN`
       */
      "PEN_FOUNTAIN" = "🖋️",
      /**
       * Emoji: 🧑‍🤝‍🧑
       */
      "PEOPLE_HOLDING_HANDS" = "🧑‍🤝‍🧑",
      /**
       * Emoji: 🫂
       */
      "PEOPLE_HUGGING" = "🫂",
      /**
       * Emoji: 👯
       *
       * Aliases: `DANCERS`
       */
      "PEOPLE_WITH_BUNNY_EARS_PARTYING" = "👯",
      /**
       * Emoji: 🤼
       *
       * Aliases: `WRESTLERS`,`WRESTLING`
       */
      "PEOPLE_WRESTLING" = "🤼",
      /**
       * Emoji: 🎭
       */
      "PERFORMING_ARTS" = "🎭",
      /**
       * Emoji: 😣
       */
      "PERSEVERE" = "😣",
      /**
       * Emoji: 🧑‍🦲
       */
      "PERSON_BALD" = "🧑‍🦲",
      /**
       * Emoji: 🚴
       *
       * Aliases: `BICYCLIST`
       */
      "PERSON_BIKING" = "🚴",
      /**
       * Emoji: ⛹️
       *
       * Aliases: `BASKETBALL_PLAYER`,`PERSON_WITH_BALL`
       */
      "PERSON_BOUNCING_BALL" = "⛹️",
      /**
       * Emoji: 🙇
       *
       * Aliases: `BOW`
       */
      "PERSON_BOWING" = "🙇",
      /**
       * Emoji: 🧗
       */
      "PERSON_CLIMBING" = "🧗",
      /**
       * Emoji: 🧑‍🦱
       */
      "PERSON_CURLY_HAIR" = "🧑‍🦱",
      /**
       * Emoji: 🤸
       *
       * Aliases: `CARTWHEEL`
       */
      "PERSON_DOING_CARTWHEEL" = "🤸",
      /**
       * Emoji: 🤦
       *
       * Aliases: `FACE_PALM`,`FACEPALM`
       */
      "PERSON_FACEPALMING" = "🤦",
      /**
       * Emoji: 🧑‍🍼
       */
      "PERSON_FEEDING_BABY" = "🧑‍🍼",
      /**
       * Emoji: 🤺
       *
       * Aliases: `FENCER`,`FENCING`
       */
      "PERSON_FENCING" = "🤺",
      /**
       * Emoji: 🙍
       */
      "PERSON_FROWNING" = "🙍",
      /**
       * Emoji: 🙅
       *
       * Aliases: `NO_GOOD`
       */
      "PERSON_GESTURING_NO" = "🙅",
      /**
       * Emoji: 🙆
       *
       * Aliases: `OK_WOMAN`
       */
      "PERSON_GESTURING_OK" = "🙆",
      /**
       * Emoji: 💇
       *
       * Aliases: `HAIRCUT`
       */
      "PERSON_GETTING_HAIRCUT" = "💇",
      /**
       * Emoji: 💆
       *
       * Aliases: `MASSAGE`
       */
      "PERSON_GETTING_MASSAGE" = "💆",
      /**
       * Emoji: 🏌️
       *
       * Aliases: `GOLFER`
       */
      "PERSON_GOLFING" = "🏌️",
      /**
       * Emoji: 🧘
       */
      "PERSON_IN_LOTUS_POSITION" = "🧘",
      /**
       * Emoji: 🧑‍🦽
       */
      "PERSON_IN_MANUAL_WHEELCHAIR" = "🧑‍🦽",
      /**
       * Emoji: 🧑‍🦼
       */
      "PERSON_IN_MOTORIZED_WHEELCHAIR" = "🧑‍🦼",
      /**
       * Emoji: 🧖
       */
      "PERSON_IN_STEAMY_ROOM" = "🧖",
      /**
       * Emoji: 🤵
       */
      "PERSON_IN_TUXEDO" = "🤵",
      /**
       * Emoji: 🤹
       *
       * Aliases: `JUGGLING`,`JUGGLER`
       */
      "PERSON_JUGGLING" = "🤹",
      /**
       * Emoji: 🧎
       */
      "PERSON_KNEELING" = "🧎",
      /**
       * Emoji: 🏋️
       *
       * Aliases: `LIFTER`,`WEIGHT_LIFTER`
       */
      "PERSON_LIFTING_WEIGHTS" = "🏋️",
      /**
       * Emoji: 🚵
       *
       * Aliases: `MOUNTAIN_BICYCLIST`
       */
      "PERSON_MOUNTAIN_BIKING" = "🚵",
      /**
       * Emoji: 🤾
       *
       * Aliases: `HANDBALL`
       */
      "PERSON_PLAYING_HANDBALL" = "🤾",
      /**
       * Emoji: 🤽
       *
       * Aliases: `WATER_POLO`
       */
      "PERSON_PLAYING_WATER_POLO" = "🤽",
      /**
       * Emoji: 🙎
       *
       * Aliases: `PERSON_WITH_POUTING_FACE`
       */
      "PERSON_POUTING" = "🙎",
      /**
       * Emoji: 🙋
       *
       * Aliases: `RAISING_HAND`
       */
      "PERSON_RAISING_HAND" = "🙋",
      /**
       * Emoji: 🧑‍🦰
       */
      "PERSON_RED_HAIR" = "🧑‍🦰",
      /**
       * Emoji: 🚣
       *
       * Aliases: `ROWBOAT`
       */
      "PERSON_ROWING_BOAT" = "🚣",
      /**
       * Emoji: 🏃
       *
       * Aliases: `RUNNER`
       */
      "PERSON_RUNNING" = "🏃",
      /**
       * Emoji: 🤷
       *
       * Aliases: `SHRUG`
       */
      "PERSON_SHRUGGING" = "🤷",
      /**
       * Emoji: 🧍
       */
      "PERSON_STANDING" = "🧍",
      /**
       * Emoji: 🏄
       *
       * Aliases: `SURFER`
       */
      "PERSON_SURFING" = "🏄",
      /**
       * Emoji: 🏊
       *
       * Aliases: `SWIMMER`
       */
      "PERSON_SWIMMING" = "🏊",
      /**
       * Emoji: 💁
       *
       * Aliases: `INFORMATION_DESK_PERSON`
       */
      "PERSON_TIPPING_HAND" = "💁",
      /**
       * Emoji: 🚶
       *
       * Aliases: `WALKING`
       */
      "PERSON_WALKING" = "🚶",
      /**
       * Emoji: 👳
       *
       * Aliases: `MAN_WITH_TURBAN`
       */
      "PERSON_WEARING_TURBAN" = "👳",
      /**
       * Emoji: 🧑‍🦳
       */
      "PERSON_WHITE_HAIR" = "🧑‍🦳",
      /**
       * Emoji: ⛹️
       *
       * Aliases: `PERSON_BOUNCING_BALL`,`BASKETBALL_PLAYER`
       */
      "PERSON_WITH_BALL" = "⛹️",
      /**
       * Emoji: 👱
       *
       * Aliases: `BLOND_HAIRED_PERSON`
       */
      "PERSON_WITH_BLOND_HAIR" = "👱",
      /**
       * Emoji: 🙎
       *
       * Aliases: `PERSON_POUTING`
       */
      "PERSON_WITH_POUTING_FACE" = "🙎",
      /**
       * Emoji: 🧑‍🦯
       */
      "PERSON_WITH_PROBING_CANE" = "🧑‍🦯",
      /**
       * Emoji: 👰
       */
      "PERSON_WITH_VEIL" = "👰",
      /**
       * Emoji: 🧫
       */
      "PETRI_DISH" = "🧫",
      /**
       * Emoji: ⛏️
       */
      "PICK" = "⛏️",
      /**
       * Emoji: 🛻
       */
      "PICKUP_TRUCK" = "🛻",
      /**
       * Emoji: 🥧
       */
      "PIE" = "🥧",
      /**
       * Emoji: 🐷
       */
      "PIG" = "🐷",
      /**
       * Emoji: 🐖
       */
      "PIG2" = "🐖",
      /**
       * Emoji: 🐽
       */
      "PIG_NOSE" = "🐽",
      /**
       * Emoji: 💊
       */
      "PILL" = "💊",
      /**
       * Emoji: 🧑‍✈️
       */
      "PILOT" = "🧑‍✈️",
      /**
       * Emoji: 🤌
       */
      "PINCHED_FINGERS" = "🤌",
      /**
       * Emoji: 🤏
       */
      "PINCHING_HAND" = "🤏",
      /**
       * Emoji: 🍍
       */
      "PINEAPPLE" = "🍍",
      /**
       * Emoji: 🏓
       *
       * Aliases: `TABLE_TENNIS`
       */
      "PING_PONG" = "🏓",
      /**
       * Emoji: 🏴‍☠️
       */
      "PIRATE_FLAG" = "🏴‍☠️",
      /**
       * Emoji: ♓
       */
      "PISCES" = "♓",
      /**
       * Emoji: 🍕
       */
      "PIZZA" = "🍕",
      /**
       * Emoji: 🪅
       */
      "PIÑATA" = "🪅",
      /**
       * Emoji: 🪧
       */
      "PLACARD" = "🪧",
      /**
       * Emoji: 🛐
       *
       * Aliases: `WORSHIP_SYMBOL`
       */
      "PLACE_OF_WORSHIP" = "🛐",
      /**
       * Emoji: ⏯️
       */
      "PLAY_PAUSE" = "⏯️",
      /**
       * Emoji: 🥺
       */
      "PLEADING_FACE" = "🥺",
      /**
       * Emoji: 🪠
       */
      "PLUNGER" = "🪠",
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
       * Emoji: ☝️
       */
      "POINT_UP" = "☝️",
      /**
       * Emoji: 👆
       */
      "POINT_UP_2" = "👆",
      /**
       * Emoji: 🐻‍❄️
       */
      "POLAR_BEAR" = "🐻‍❄️",
      /**
       * Emoji: 🚓
       */
      "POLICE_CAR" = "🚓",
      /**
       * Emoji: 👮
       *
       * Aliases: `COP`
       */
      "POLICE_OFFICER" = "👮",
      /**
       * Emoji: 💩
       *
       * Aliases: `POOP`,`SHIT`,`HANKEY`
       */
      "POO" = "💩",
      /**
       * Emoji: 🐩
       */
      "POODLE" = "🐩",
      /**
       * Emoji: 💩
       *
       * Aliases: `SHIT`,`HANKEY`,`POO`
       */
      "POOP" = "💩",
      /**
       * Emoji: 🍿
       */
      "POPCORN" = "🍿",
      /**
       * Emoji: 📯
       */
      "POSTAL_HORN" = "📯",
      /**
       * Emoji: 📮
       */
      "POSTBOX" = "📮",
      /**
       * Emoji: 🏣
       */
      "POST_OFFICE" = "🏣",
      /**
       * Emoji: 🚰
       */
      "POTABLE_WATER" = "🚰",
      /**
       * Emoji: 🥔
       */
      "POTATO" = "🥔",
      /**
       * Emoji: 🪴
       */
      "POTTED_PLANT" = "🪴",
      /**
       * Emoji: 👝
       */
      "POUCH" = "👝",
      /**
       * Emoji: 🍗
       */
      "POULTRY_LEG" = "🍗",
      /**
       * Emoji: 💷
       */
      "POUND" = "💷",
      /**
       * Emoji: 😾
       */
      "POUTING_CAT" = "😾",
      /**
       * Emoji: 🙏
       */
      "PRAY" = "🙏",
      /**
       * Emoji: 📿
       */
      "PRAYER_BEADS" = "📿",
      /**
       * Emoji: 🤰
       *
       * Aliases: `EXPECTING_WOMAN`
       */
      "PREGNANT_WOMAN" = "🤰",
      /**
       * Emoji: 🥨
       */
      "PRETZEL" = "🥨",
      /**
       * Emoji: ⏮️
       *
       * Aliases: `TRACK_PREVIOUS`
       */
      "PREVIOUS_TRACK" = "⏮️",
      /**
       * Emoji: 🤴
       */
      "PRINCE" = "🤴",
      /**
       * Emoji: 👸
       */
      "PRINCESS" = "👸",
      /**
       * Emoji: 🖨️
       */
      "PRINTER" = "🖨️",
      /**
       * Emoji: 🦯
       */
      "PROBING_CANE" = "🦯",
      /**
       * Emoji: 📽️
       *
       * Aliases: `FILM_PROJECTOR`
       */
      "PROJECTOR" = "📽️",
      /**
       * Emoji: 🍮
       *
       * Aliases: `CUSTARD`,`FLAN`
       */
      "PUDDING" = "🍮",
      /**
       * Emoji: 👊
       */
      "PUNCH" = "👊",
      /**
       * Emoji: 🟣
       */
      "PURPLE_CIRCLE" = "🟣",
      /**
       * Emoji: 💜
       */
      "PURPLE_HEART" = "💜",
      /**
       * Emoji: 🟪
       */
      "PURPLE_SQUARE" = "🟪",
      /**
       * Emoji: 👛
       */
      "PURSE" = "👛",
      /**
       * Emoji: 📌
       */
      "PUSHPIN" = "📌",
      /**
       * Emoji: 🚮
       */
      "PUT_LITTER_IN_ITS_PLACE" = "🚮",
      /**
       * Emoji: ❓
       */
      "QUESTION" = "❓",
      /**
       * Emoji: 🐰
       */
      "RABBIT" = "🐰",
      /**
       * Emoji: 🐇
       */
      "RABBIT2" = "🐇",
      /**
       * Emoji: 🦝
       */
      "RACCOON" = "🦝",
      /**
       * Emoji: 🐎
       */
      "RACEHORSE" = "🐎",
      /**
       * Emoji: 🏎️
       *
       * Aliases: `RACING_CAR`
       */
      "RACE_CAR" = "🏎️",
      /**
       * Emoji: 🏎️
       *
       * Aliases: `RACE_CAR`
       */
      "RACING_CAR" = "🏎️",
      /**
       * Emoji: 🏍️
       *
       * Aliases: `MOTORCYCLE`
       */
      "RACING_MOTORCYCLE" = "🏍️",
      /**
       * Emoji: 📻
       */
      "RADIO" = "📻",
      /**
       * Emoji: ☢️
       *
       * Aliases: `RADIOACTIVE_SIGN`
       */
      "RADIOACTIVE" = "☢️",
      /**
       * Emoji: ☢️
       *
       * Aliases: `RADIOACTIVE`
       */
      "RADIOACTIVE_SIGN" = "☢️",
      /**
       * Emoji: 🔘
       */
      "RADIO_BUTTON" = "🔘",
      /**
       * Emoji: 😡
       */
      "RAGE" = "😡",
      /**
       * Emoji: 🛤️
       *
       * Aliases: `RAILWAY_TRACK`
       */
      "RAILROAD_TRACK" = "🛤️",
      /**
       * Emoji: 🚃
       */
      "RAILWAY_CAR" = "🚃",
      /**
       * Emoji: 🛤️
       *
       * Aliases: `RAILROAD_TRACK`
       */
      "RAILWAY_TRACK" = "🛤️",
      /**
       * Emoji: 🌈
       */
      "RAINBOW" = "🌈",
      /**
       * Emoji: 🏳️‍🌈
       *
       * Aliases: `GAY_PRIDE_FLAG`
       */
      "RAINBOW_FLAG" = "🏳️‍🌈",
      /**
       * Emoji: 🤚
       *
       * Aliases: `BACK_OF_HAND`
       */
      "RAISED_BACK_OF_HAND" = "🤚",
      /**
       * Emoji: ✋
       */
      "RAISED_HAND" = "✋",
      /**
       * Emoji: 🙌
       */
      "RAISED_HANDS" = "🙌",
      /**
       * Emoji: 🖐️
       *
       * Aliases: `HAND_SPLAYED`
       */
      "RAISED_HAND_WITH_FINGERS_SPLAYED" = "🖐️",
      /**
       * Emoji: 🖖
       *
       * Aliases: `VULCAN`
       */
      "RAISED_HAND_WITH_PART_BETWEEN_MIDDLE_AND_RING_FINGERS" = "🖖",
      /**
       * Emoji: 🙋
       *
       * Aliases: `PERSON_RAISING_HAND`
       */
      "RAISING_HAND" = "🙋",
      /**
       * Emoji: 🐏
       */
      "RAM" = "🐏",
      /**
       * Emoji: 🍜
       */
      "RAMEN" = "🍜",
      /**
       * Emoji: 🐀
       */
      "RAT" = "🐀",
      /**
       * Emoji: 🪒
       */
      "RAZOR" = "🪒",
      /**
       * Emoji: 🧾
       */
      "RECEIPT" = "🧾",
      /**
       * Emoji: ⏺️
       */
      "RECORD_BUTTON" = "⏺️",
      /**
       * Emoji: ♻️
       */
      "RECYCLE" = "♻️",
      /**
       * Emoji: 🚗
       */
      "RED_CAR" = "🚗",
      /**
       * Emoji: 🔴
       */
      "RED_CIRCLE" = "🔴",
      /**
       * Emoji: 🧧
       */
      "RED_ENVELOPE" = "🧧",
      /**
       * Emoji: 🟥
       */
      "RED_SQUARE" = "🟥",
      /**
       * Emoji: 🇦
       */
      "REGIONAL_INDICATOR_A" = "🇦",
      /**
       * Emoji: 🇧
       */
      "REGIONAL_INDICATOR_B" = "🇧",
      /**
       * Emoji: 🇨
       */
      "REGIONAL_INDICATOR_C" = "🇨",
      /**
       * Emoji: 🇩
       */
      "REGIONAL_INDICATOR_D" = "🇩",
      /**
       * Emoji: 🇪
       */
      "REGIONAL_INDICATOR_E" = "🇪",
      /**
       * Emoji: 🇫
       */
      "REGIONAL_INDICATOR_F" = "🇫",
      /**
       * Emoji: 🇬
       */
      "REGIONAL_INDICATOR_G" = "🇬",
      /**
       * Emoji: 🇭
       */
      "REGIONAL_INDICATOR_H" = "🇭",
      /**
       * Emoji: 🇮
       */
      "REGIONAL_INDICATOR_I" = "🇮",
      /**
       * Emoji: 🇯
       */
      "REGIONAL_INDICATOR_J" = "🇯",
      /**
       * Emoji: 🇰
       */
      "REGIONAL_INDICATOR_K" = "🇰",
      /**
       * Emoji: 🇱
       */
      "REGIONAL_INDICATOR_L" = "🇱",
      /**
       * Emoji: 🇲
       */
      "REGIONAL_INDICATOR_M" = "🇲",
      /**
       * Emoji: 🇳
       */
      "REGIONAL_INDICATOR_N" = "🇳",
      /**
       * Emoji: 🇴
       */
      "REGIONAL_INDICATOR_O" = "🇴",
      /**
       * Emoji: 🇵
       */
      "REGIONAL_INDICATOR_P" = "🇵",
      /**
       * Emoji: 🇶
       */
      "REGIONAL_INDICATOR_Q" = "🇶",
      /**
       * Emoji: 🇷
       */
      "REGIONAL_INDICATOR_R" = "🇷",
      /**
       * Emoji: 🇸
       */
      "REGIONAL_INDICATOR_S" = "🇸",
      /**
       * Emoji: 🇹
       */
      "REGIONAL_INDICATOR_T" = "🇹",
      /**
       * Emoji: 🇺
       */
      "REGIONAL_INDICATOR_U" = "🇺",
      /**
       * Emoji: 🇻
       */
      "REGIONAL_INDICATOR_V" = "🇻",
      /**
       * Emoji: 🇼
       */
      "REGIONAL_INDICATOR_W" = "🇼",
      /**
       * Emoji: 🇽
       */
      "REGIONAL_INDICATOR_X" = "🇽",
      /**
       * Emoji: 🇾
       */
      "REGIONAL_INDICATOR_Y" = "🇾",
      /**
       * Emoji: 🇿
       */
      "REGIONAL_INDICATOR_Z" = "🇿",
      /**
       * Emoji: ®️
       */
      "REGISTERED" = "®️",
      /**
       * Emoji: ☺️
       */
      "RELAXED" = "☺️",
      /**
       * Emoji: 😌
       */
      "RELIEVED" = "😌",
      /**
       * Emoji: 🎗️
       */
      "REMINDER_RIBBON" = "🎗️",
      /**
       * Emoji: 🔁
       */
      "REPEAT" = "🔁",
      /**
       * Emoji: 🔂
       */
      "REPEAT_ONE" = "🔂",
      /**
       * Emoji: 🚻
       */
      "RESTROOM" = "🚻",
      /**
       * Emoji: 🖕
       *
       * Aliases: `MIDDLE_FINGER`
       */
      "REVERSED_HAND_WITH_MIDDLE_FINGER_EXTENDED" = "🖕",
      /**
       * Emoji: 💞
       */
      "REVOLVING_HEARTS" = "💞",
      /**
       * Emoji: ⏪
       */
      "REWIND" = "⏪",
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
       * Emoji: 🎀
       */
      "RIBBON" = "🎀",
      /**
       * Emoji: 🍚
       */
      "RICE" = "🍚",
      /**
       * Emoji: 🍙
       */
      "RICE_BALL" = "🍙",
      /**
       * Emoji: 🍘
       */
      "RICE_CRACKER" = "🍘",
      /**
       * Emoji: 🎑
       */
      "RICE_SCENE" = "🎑",
      /**
       * Emoji: 🗯️
       *
       * Aliases: `ANGER_RIGHT`
       */
      "RIGHT_ANGER_BUBBLE" = "🗯️",
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
       * Emoji: 💍
       */
      "RING" = "💍",
      /**
       * Emoji: 🪐
       */
      "RINGED_PLANET" = "🪐",
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
       * Emoji: 🪨
       */
      "ROCK" = "🪨",
      /**
       * Emoji: 🚀
       */
      "ROCKET" = "🚀",
      /**
       * Emoji: 🤣
       *
       * Aliases: `ROLLING_ON_THE_FLOOR_LAUGHING`
       */
      "ROFL" = "🤣",
      /**
       * Emoji: 🗞️
       *
       * Aliases: `NEWSPAPER2`
       */
      "ROLLED_UP_NEWSPAPER" = "🗞️",
      /**
       * Emoji: 🎢
       */
      "ROLLER_COASTER" = "🎢",
      /**
       * Emoji: 🛼
       */
      "ROLLER_SKATE" = "🛼",
      /**
       * Emoji: 🙄
       *
       * Aliases: `FACE_WITH_ROLLING_EYES`
       */
      "ROLLING_EYES" = "🙄",
      /**
       * Emoji: 🤣
       *
       * Aliases: `ROFL`
       */
      "ROLLING_ON_THE_FLOOR_LAUGHING" = "🤣",
      /**
       * Emoji: 🧻
       */
      "ROLL_OF_PAPER" = "🧻",
      /**
       * Emoji: 🐓
       */
      "ROOSTER" = "🐓",
      /**
       * Emoji: 🌹
       */
      "ROSE" = "🌹",
      /**
       * Emoji: 🏵️
       */
      "ROSETTE" = "🏵️",
      /**
       * Emoji: 🚨
       */
      "ROTATING_LIGHT" = "🚨",
      /**
       * Emoji: 📍
       */
      "ROUND_PUSHPIN" = "📍",
      /**
       * Emoji: 🚣
       *
       * Aliases: `PERSON_ROWING_BOAT`
       */
      "ROWBOAT" = "🚣",
      /**
       * Emoji: 🏉
       */
      "RUGBY_FOOTBALL" = "🏉",
      /**
       * Emoji: 🏃
       *
       * Aliases: `PERSON_RUNNING`
       */
      "RUNNER" = "🏃",
      /**
       * Emoji: 🎽
       */
      "RUNNING_SHIRT_WITH_SASH" = "🎽",
      /**
       * Emoji: 🈂️
       */
      "SA" = "🈂️",
      /**
       * Emoji: 🧷
       */
      "SAFETY_PIN" = "🧷",
      /**
       * Emoji: 🦺
       */
      "SAFETY_VEST" = "🦺",
      /**
       * Emoji: ♐
       */
      "SAGITTARIUS" = "♐",
      /**
       * Emoji: ⛵
       */
      "SAILBOAT" = "⛵",
      /**
       * Emoji: 🍶
       */
      "SAKE" = "🍶",
      /**
       * Emoji: 🥗
       *
       * Aliases: `GREEN_SALAD`
       */
      "SALAD" = "🥗",
      /**
       * Emoji: 🧂
       */
      "SALT" = "🧂",
      /**
       * Emoji: 👡
       */
      "SANDAL" = "👡",
      /**
       * Emoji: 🥪
       */
      "SANDWICH" = "🥪",
      /**
       * Emoji: 🎅
       */
      "SANTA" = "🎅",
      /**
       * Emoji: 🥻
       */
      "SARI" = "🥻",
      /**
       * Emoji: 📡
       */
      "SATELLITE" = "📡",
      /**
       * Emoji: 🛰️
       */
      "SATELLITE_ORBITAL" = "🛰️",
      /**
       * Emoji: 😆
       *
       * Aliases: `LAUGHING`
       */
      "SATISFIED" = "😆",
      /**
       * Emoji: 🦕
       */
      "SAUROPOD" = "🦕",
      /**
       * Emoji: 🎷
       */
      "SAXOPHONE" = "🎷",
      /**
       * Emoji: ⚖️
       */
      "SCALES" = "⚖️",
      /**
       * Emoji: 🧣
       */
      "SCARF" = "🧣",
      /**
       * Emoji: 🏫
       */
      "SCHOOL" = "🏫",
      /**
       * Emoji: 🎒
       */
      "SCHOOL_SATCHEL" = "🎒",
      /**
       * Emoji: 🧑‍🔬
       */
      "SCIENTIST" = "🧑‍🔬",
      /**
       * Emoji: ✂️
       */
      "SCISSORS" = "✂️",
      /**
       * Emoji: 🛴
       */
      "SCOOTER" = "🛴",
      /**
       * Emoji: 🦂
       */
      "SCORPION" = "🦂",
      /**
       * Emoji: ♏
       */
      "SCORPIUS" = "♏",
      /**
       * Emoji: 🏴󠁧󠁢󠁳󠁣󠁴󠁿
       */
      "SCOTLAND" = "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
      /**
       * Emoji: 😱
       */
      "SCREAM" = "😱",
      /**
       * Emoji: 🙀
       */
      "SCREAM_CAT" = "🙀",
      /**
       * Emoji: 🪛
       */
      "SCREWDRIVER" = "🪛",
      /**
       * Emoji: 📜
       */
      "SCROLL" = "📜",
      /**
       * Emoji: 🦭
       */
      "SEAL" = "🦭",
      /**
       * Emoji: 💺
       */
      "SEAT" = "💺",
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
       * Emoji: ㊙️
       */
      "SECRET" = "㊙️",
      /**
       * Emoji: 🌱
       */
      "SEEDLING" = "🌱",
      /**
       * Emoji: 🙈
       */
      "SEE_NO_EVIL" = "🙈",
      /**
       * Emoji: 🤳
       */
      "SELFIE" = "🤳",
      /**
       * Emoji: 🐕‍🦺
       */
      "SERVICE_DOG" = "🐕‍🦺",
      /**
       * Emoji: 7️⃣
       */
      "SEVEN" = "7️⃣",
      /**
       * Emoji: 🪡
       */
      "SEWING_NEEDLE" = "🪡",
      /**
       * Emoji: 🤝
       *
       * Aliases: `HANDSHAKE`
       */
      "SHAKING_HANDS" = "🤝",
      /**
       * Emoji: 🥘
       *
       * Aliases: `PAELLA`
       */
      "SHALLOW_PAN_OF_FOOD" = "🥘",
      /**
       * Emoji: ☘️
       */
      "SHAMROCK" = "☘️",
      /**
       * Emoji: 🦈
       */
      "SHARK" = "🦈",
      /**
       * Emoji: 🍧
       */
      "SHAVED_ICE" = "🍧",
      /**
       * Emoji: 🐑
       */
      "SHEEP" = "🐑",
      /**
       * Emoji: 🐚
       */
      "SHELL" = "🐚",
      /**
       * Emoji: 🥜
       *
       * Aliases: `PEANUTS`
       */
      "SHELLED_PEANUT" = "🥜",
      /**
       * Emoji: 🛡️
       */
      "SHIELD" = "🛡️",
      /**
       * Emoji: ⛩️
       */
      "SHINTO_SHRINE" = "⛩️",
      /**
       * Emoji: 🚢
       */
      "SHIP" = "🚢",
      /**
       * Emoji: 👕
       */
      "SHIRT" = "👕",
      /**
       * Emoji: 💩
       *
       * Aliases: `POOP`,`HANKEY`,`POO`
       */
      "SHIT" = "💩",
      /**
       * Emoji: 🛍️
       */
      "SHOPPING_BAGS" = "🛍️",
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
       * Emoji: 🩳
       */
      "SHORTS" = "🩳",
      /**
       * Emoji: 🚿
       */
      "SHOWER" = "🚿",
      /**
       * Emoji: 🦐
       */
      "SHRIMP" = "🦐",
      /**
       * Emoji: 🤷
       *
       * Aliases: `PERSON_SHRUGGING`
       */
      "SHRUG" = "🤷",
      /**
       * Emoji: 🤫
       */
      "SHUSHING_FACE" = "🤫",
      /**
       * Emoji: 🤢
       *
       * Aliases: `NAUSEATED_FACE`
       */
      "SICK" = "🤢",
      /**
       * Emoji: 📶
       */
      "SIGNAL_STRENGTH" = "📶",
      /**
       * Emoji: 🤘
       *
       * Aliases: `METAL`
       */
      "SIGN_OF_THE_HORNS" = "🤘",
      /**
       * Emoji: 🧑‍🎤
       */
      "SINGER" = "🧑‍🎤",
      /**
       * Emoji: 6️⃣
       */
      "SIX" = "6️⃣",
      /**
       * Emoji: 🔯
       */
      "SIX_POINTED_STAR" = "🔯",
      /**
       * Emoji: 🛹
       */
      "SKATEBOARD" = "🛹",
      /**
       * Emoji: 💀
       *
       * Aliases: `SKULL`
       */
      "SKELETON" = "💀",
      /**
       * Emoji: 🎿
       */
      "SKI" = "🎿",
      /**
       * Emoji: ⛷️
       */
      "SKIER" = "⛷️",
      /**
       * Emoji: 💀
       *
       * Aliases: `SKELETON`
       */
      "SKULL" = "💀",
      /**
       * Emoji: ☠️
       *
       * Aliases: `SKULL_CROSSBONES`
       */
      "SKULL_AND_CROSSBONES" = "☠️",
      /**
       * Emoji: ☠️
       *
       * Aliases: `SKULL_AND_CROSSBONES`
       */
      "SKULL_CROSSBONES" = "☠️",
      /**
       * Emoji: 🦨
       */
      "SKUNK" = "🦨",
      /**
       * Emoji: 🛷
       */
      "SLED" = "🛷",
      /**
       * Emoji: 😴
       */
      "SLEEPING" = "😴",
      /**
       * Emoji: 🛌
       */
      "SLEEPING_ACCOMMODATION" = "🛌",
      /**
       * Emoji: 😪
       */
      "SLEEPY" = "😪",
      /**
       * Emoji: 🕵️
       *
       * Aliases: `DETECTIVE`,`SPY`
       */
      "SLEUTH_OR_SPY" = "🕵️",
      /**
       * Emoji: 🙁
       *
       * Aliases: `SLIGHT_FROWN`
       */
      "SLIGHTLY_FROWNING_FACE" = "🙁",
      /**
       * Emoji: 🙂
       *
       * Aliases: `SLIGHT_SMILE`
       */
      "SLIGHTLY_SMILING_FACE" = "🙂",
      /**
       * Emoji: 🙁
       *
       * Aliases: `SLIGHTLY_FROWNING_FACE`
       */
      "SLIGHT_FROWN" = "🙁",
      /**
       * Emoji: 🙂
       *
       * Aliases: `SLIGHTLY_SMILING_FACE`
       */
      "SLIGHT_SMILE" = "🙂",
      /**
       * Emoji: 🦥
       */
      "SLOTH" = "🦥",
      /**
       * Emoji: 🎰
       */
      "SLOT_MACHINE" = "🎰",
      /**
       * Emoji: 🛩️
       *
       * Aliases: `AIRPLANE_SMALL`
       */
      "SMALL_AIRPLANE" = "🛩️",
      /**
       * Emoji: 🔹
       */
      "SMALL_BLUE_DIAMOND" = "🔹",
      /**
       * Emoji: 🔸
       */
      "SMALL_ORANGE_DIAMOND" = "🔸",
      /**
       * Emoji: 🔺
       */
      "SMALL_RED_TRIANGLE" = "🔺",
      /**
       * Emoji: 🔻
       */
      "SMALL_RED_TRIANGLE_DOWN" = "🔻",
      /**
       * Emoji: 😄
       */
      "SMILE" = "😄",
      /**
       * Emoji: 😃
       */
      "SMILEY" = "😃",
      /**
       * Emoji: 😺
       */
      "SMILEY_CAT" = "😺",
      /**
       * Emoji: 😸
       */
      "SMILE_CAT" = "😸",
      /**
       * Emoji: 🥰
       */
      "SMILING_FACE_WITH_3_HEARTS" = "🥰",
      /**
       * Emoji: 🥲
       */
      "SMILING_FACE_WITH_TEAR" = "🥲",
      /**
       * Emoji: 😈
       */
      "SMILING_IMP" = "😈",
      /**
       * Emoji: 😏
       */
      "SMIRK" = "😏",
      /**
       * Emoji: 😼
       */
      "SMIRK_CAT" = "😼",
      /**
       * Emoji: 🚬
       */
      "SMOKING" = "🚬",
      /**
       * Emoji: 🐌
       */
      "SNAIL" = "🐌",
      /**
       * Emoji: 🐍
       */
      "SNAKE" = "🐍",
      /**
       * Emoji: 🤧
       *
       * Aliases: `SNEEZING_FACE`
       */
      "SNEEZE" = "🤧",
      /**
       * Emoji: 🤧
       *
       * Aliases: `SNEEZE`
       */
      "SNEEZING_FACE" = "🤧",
      /**
       * Emoji: 🏂
       */
      "SNOWBOARDER" = "🏂",
      /**
       * Emoji: ❄️
       */
      "SNOWFLAKE" = "❄️",
      /**
       * Emoji: ⛄
       */
      "SNOWMAN" = "⛄",
      /**
       * Emoji: ☃️
       */
      "SNOWMAN2" = "☃️",
      /**
       * Emoji: 🏔️
       *
       * Aliases: `MOUNTAIN_SNOW`
       */
      "SNOW_CAPPED_MOUNTAIN" = "🏔️",
      /**
       * Emoji: 🧼
       */
      "SOAP" = "🧼",
      /**
       * Emoji: 😭
       */
      "SOB" = "😭",
      /**
       * Emoji: ⚽
       */
      "SOCCER" = "⚽",
      /**
       * Emoji: 🧦
       */
      "SOCKS" = "🧦",
      /**
       * Emoji: 🥎
       */
      "SOFTBALL" = "🥎",
      /**
       * Emoji: 🔜
       */
      "SOON" = "🔜",
      /**
       * Emoji: 🆘
       */
      "SOS" = "🆘",
      /**
       * Emoji: 🔉
       */
      "SOUND" = "🔉",
      /**
       * Emoji: 👾
       */
      "SPACE_INVADER" = "👾",
      /**
       * Emoji: ♠️
       */
      "SPADES" = "♠️",
      /**
       * Emoji: 🍝
       */
      "SPAGHETTI" = "🍝",
      /**
       * Emoji: ❇️
       */
      "SPARKLE" = "❇️",
      /**
       * Emoji: 🎇
       */
      "SPARKLER" = "🎇",
      /**
       * Emoji: ✨
       */
      "SPARKLES" = "✨",
      /**
       * Emoji: 💖
       */
      "SPARKLING_HEART" = "💖",
      /**
       * Emoji: 🔈
       */
      "SPEAKER" = "🔈",
      /**
       * Emoji: 🗣️
       *
       * Aliases: `SPEAKING_HEAD_IN_SILHOUETTE`
       */
      "SPEAKING_HEAD" = "🗣️",
      /**
       * Emoji: 🗣️
       *
       * Aliases: `SPEAKING_HEAD`
       */
      "SPEAKING_HEAD_IN_SILHOUETTE" = "🗣️",
      /**
       * Emoji: 🙊
       */
      "SPEAK_NO_EVIL" = "🙊",
      /**
       * Emoji: 💬
       */
      "SPEECH_BALLOON" = "💬",
      /**
       * Emoji: 🗨️
       *
       * Aliases: `LEFT_SPEECH_BUBBLE`
       */
      "SPEECH_LEFT" = "🗨️",
      /**
       * Emoji: 🚤
       */
      "SPEEDBOAT" = "🚤",
      /**
       * Emoji: 🕷️
       */
      "SPIDER" = "🕷️",
      /**
       * Emoji: 🕸️
       */
      "SPIDER_WEB" = "🕸️",
      /**
       * Emoji: 🗓️
       *
       * Aliases: `CALENDAR_SPIRAL`
       */
      "SPIRAL_CALENDAR_PAD" = "🗓️",
      /**
       * Emoji: 🗒️
       *
       * Aliases: `NOTEPAD_SPIRAL`
       */
      "SPIRAL_NOTE_PAD" = "🗒️",
      /**
       * Emoji: 🧽
       */
      "SPONGE" = "🧽",
      /**
       * Emoji: 🥄
       */
      "SPOON" = "🥄",
      /**
       * Emoji: 🏅
       *
       * Aliases: `MEDAL`
       */
      "SPORTS_MEDAL" = "🏅",
      /**
       * Emoji: 🕵️
       *
       * Aliases: `DETECTIVE`,`SLEUTH_OR_SPY`
       */
      "SPY" = "🕵️",
      /**
       * Emoji: 🧴
       */
      "SQUEEZE_BOTTLE" = "🧴",
      /**
       * Emoji: 🦑
       */
      "SQUID" = "🦑",
      /**
       * Emoji: 🏟️
       */
      "STADIUM" = "🏟️",
      /**
       * Emoji: ⭐
       */
      "STAR" = "⭐",
      /**
       * Emoji: 🌟
       */
      "STAR2" = "🌟",
      /**
       * Emoji: 🌠
       */
      "STARS" = "🌠",
      /**
       * Emoji: ☪️
       */
      "STAR_AND_CRESCENT" = "☪️",
      /**
       * Emoji: ✡️
       */
      "STAR_OF_DAVID" = "✡️",
      /**
       * Emoji: 🤩
       */
      "STAR_STRUCK" = "🤩",
      /**
       * Emoji: 🚉
       */
      "STATION" = "🚉",
      /**
       * Emoji: 🗽
       */
      "STATUE_OF_LIBERTY" = "🗽",
      /**
       * Emoji: 🚂
       */
      "STEAM_LOCOMOTIVE" = "🚂",
      /**
       * Emoji: 🩺
       */
      "STETHOSCOPE" = "🩺",
      /**
       * Emoji: 🍲
       */
      "STEW" = "🍲",
      /**
       * Emoji: ⏱️
       */
      "STOPWATCH" = "⏱️",
      /**
       * Emoji: ⏹️
       */
      "STOP_BUTTON" = "⏹️",
      /**
       * Emoji: 🛑
       *
       * Aliases: `OCTAGONAL_SIGN`
       */
      "STOP_SIGN" = "🛑",
      /**
       * Emoji: 📏
       */
      "STRAIGHT_RULER" = "📏",
      /**
       * Emoji: 🍓
       */
      "STRAWBERRY" = "🍓",
      /**
       * Emoji: 😛
       */
      "STUCK_OUT_TONGUE" = "😛",
      /**
       * Emoji: 😝
       */
      "STUCK_OUT_TONGUE_CLOSED_EYES" = "😝",
      /**
       * Emoji: 😜
       */
      "STUCK_OUT_TONGUE_WINKING_EYE" = "😜",
      /**
       * Emoji: 🧑‍🎓
       */
      "STUDENT" = "🧑‍🎓",
      /**
       * Emoji: 🎙️
       *
       * Aliases: `MICROPHONE2`
       */
      "STUDIO_MICROPHONE" = "🎙️",
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
       * Emoji: 🌻
       */
      "SUNFLOWER" = "🌻",
      /**
       * Emoji: 😎
       */
      "SUNGLASSES" = "😎",
      /**
       * Emoji: ☀️
       */
      "SUNNY" = "☀️",
      /**
       * Emoji: 🌅
       */
      "SUNRISE" = "🌅",
      /**
       * Emoji: 🌄
       */
      "SUNRISE_OVER_MOUNTAINS" = "🌄",
      /**
       * Emoji: 🌞
       */
      "SUN_WITH_FACE" = "🌞",
      /**
       * Emoji: 🦸
       */
      "SUPERHERO" = "🦸",
      /**
       * Emoji: 🦹
       */
      "SUPERVILLAIN" = "🦹",
      /**
       * Emoji: 🏄
       *
       * Aliases: `PERSON_SURFING`
       */
      "SURFER" = "🏄",
      /**
       * Emoji: 🍣
       */
      "SUSHI" = "🍣",
      /**
       * Emoji: 🚟
       */
      "SUSPENSION_RAILWAY" = "🚟",
      /**
       * Emoji: 🦢
       */
      "SWAN" = "🦢",
      /**
       * Emoji: 😓
       */
      "SWEAT" = "😓",
      /**
       * Emoji: 💦
       */
      "SWEAT_DROPS" = "💦",
      /**
       * Emoji: 😅
       */
      "SWEAT_SMILE" = "😅",
      /**
       * Emoji: 🍠
       */
      "SWEET_POTATO" = "🍠",
      /**
       * Emoji: 🏊
       *
       * Aliases: `PERSON_SWIMMING`
       */
      "SWIMMER" = "🏊",
      /**
       * Emoji: 🔣
       */
      "SYMBOLS" = "🔣",
      /**
       * Emoji: 🕍
       */
      "SYNAGOGUE" = "🕍",
      /**
       * Emoji: 💉
       */
      "SYRINGE" = "💉",
      /**
       * Emoji: 🏓
       *
       * Aliases: `PING_PONG`
       */
      "TABLE_TENNIS" = "🏓",
      /**
       * Emoji: 🌮
       */
      "TACO" = "🌮",
      /**
       * Emoji: 🎉
       */
      "TADA" = "🎉",
      /**
       * Emoji: 🥡
       */
      "TAKEOUT_BOX" = "🥡",
      /**
       * Emoji: 🫔
       */
      "TAMALE" = "🫔",
      /**
       * Emoji: 🎋
       */
      "TANABATA_TREE" = "🎋",
      /**
       * Emoji: 🍊
       */
      "TANGERINE" = "🍊",
      /**
       * Emoji: ♉
       */
      "TAURUS" = "♉",
      /**
       * Emoji: 🚕
       */
      "TAXI" = "🚕",
      /**
       * Emoji: 🍵
       */
      "TEA" = "🍵",
      /**
       * Emoji: 🧑‍🏫
       */
      "TEACHER" = "🧑‍🏫",
      /**
       * Emoji: 🫖
       */
      "TEAPOT" = "🫖",
      /**
       * Emoji: 🧑‍💻
       */
      "TECHNOLOGIST" = "🧑‍💻",
      /**
       * Emoji: 🧸
       */
      "TEDDY_BEAR" = "🧸",
      /**
       * Emoji: ☎️
       */
      "TELEPHONE" = "☎️",
      /**
       * Emoji: 📞
       */
      "TELEPHONE_RECEIVER" = "📞",
      /**
       * Emoji: 🔭
       */
      "TELESCOPE" = "🔭",
      /**
       * Emoji: 🎾
       */
      "TENNIS" = "🎾",
      /**
       * Emoji: ⛺
       */
      "TENT" = "⛺",
      /**
       * Emoji: 🧪
       */
      "TEST_TUBE" = "🧪",
      /**
       * Emoji: 🌡️
       */
      "THERMOMETER" = "🌡️",
      /**
       * Emoji: 🤒
       *
       * Aliases: `FACE_WITH_THERMOMETER`
       */
      "THERMOMETER_FACE" = "🤒",
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
       * Emoji: 🩴
       */
      "THONG_SANDAL" = "🩴",
      /**
       * Emoji: 💭
       */
      "THOUGHT_BALLOON" = "💭",
      /**
       * Emoji: 🧵
       */
      "THREAD" = "🧵",
      /**
       * Emoji: 3️⃣
       */
      "THREE" = "3️⃣",
      /**
       * Emoji: 🖱️
       *
       * Aliases: `MOUSE_THREE_BUTTON`
       */
      "THREE_BUTTON_MOUSE" = "🖱️",
      /**
       * Emoji: 👎
       *
       * Aliases: `THUMBSDOWN`,`_-1`
       */
      "THUMBDOWN" = "👎",
      /**
       * Emoji: 👎
       *
       * Aliases: `_-1`,`THUMBDOWN`
       */
      "THUMBSDOWN" = "👎",
      /**
       * Emoji: 👍
       *
       * Aliases: `_+1`,`THUMBUP`
       */
      "THUMBSUP" = "👍",
      /**
       * Emoji: 👍
       *
       * Aliases: `THUMBSUP`,`_+1`
       */
      "THUMBUP" = "👍",
      /**
       * Emoji: ⛈️
       *
       * Aliases: `THUNDER_CLOUD_RAIN`
       */
      "THUNDER_CLOUD_AND_RAIN" = "⛈️",
      /**
       * Emoji: ⛈️
       *
       * Aliases: `THUNDER_CLOUD_AND_RAIN`
       */
      "THUNDER_CLOUD_RAIN" = "⛈️",
      /**
       * Emoji: 🎫
       */
      "TICKET" = "🎫",
      /**
       * Emoji: 🎟️
       *
       * Aliases: `ADMISSION_TICKETS`
       */
      "TICKETS" = "🎟️",
      /**
       * Emoji: 🐯
       */
      "TIGER" = "🐯",
      /**
       * Emoji: 🐅
       */
      "TIGER2" = "🐅",
      /**
       * Emoji: ⏲️
       *
       * Aliases: `TIMER_CLOCK`
       */
      "TIMER" = "⏲️",
      /**
       * Emoji: ⏲️
       *
       * Aliases: `TIMER`
       */
      "TIMER_CLOCK" = "⏲️",
      /**
       * Emoji: 😫
       */
      "TIRED_FACE" = "😫",
      /**
       * Emoji: ™️
       */
      "TM" = "™️",
      /**
       * Emoji: 🚽
       */
      "TOILET" = "🚽",
      /**
       * Emoji: 🗼
       */
      "TOKYO_TOWER" = "🗼",
      /**
       * Emoji: 🍅
       */
      "TOMATO" = "🍅",
      /**
       * Emoji: 👅
       */
      "TONGUE" = "👅",
      /**
       * Emoji: 🧰
       */
      "TOOLBOX" = "🧰",
      /**
       * Emoji: 🛠️
       *
       * Aliases: `HAMMER_AND_WRENCH`
       */
      "TOOLS" = "🛠️",
      /**
       * Emoji: 🦷
       */
      "TOOTH" = "🦷",
      /**
       * Emoji: 🪥
       */
      "TOOTHBRUSH" = "🪥",
      /**
       * Emoji: 🔝
       */
      "TOP" = "🔝",
      /**
       * Emoji: 🎩
       */
      "TOPHAT" = "🎩",
      /**
       * Emoji: 🖲️
       */
      "TRACKBALL" = "🖲️",
      /**
       * Emoji: ⏭️
       *
       * Aliases: `NEXT_TRACK`
       */
      "TRACK_NEXT" = "⏭️",
      /**
       * Emoji: ⏮️
       *
       * Aliases: `PREVIOUS_TRACK`
       */
      "TRACK_PREVIOUS" = "⏮️",
      /**
       * Emoji: 🚜
       */
      "TRACTOR" = "🚜",
      /**
       * Emoji: 🚥
       */
      "TRAFFIC_LIGHT" = "🚥",
      /**
       * Emoji: 🚋
       */
      "TRAIN" = "🚋",
      /**
       * Emoji: 🚆
       */
      "TRAIN2" = "🚆",
      /**
       * Emoji: 🚊
       */
      "TRAM" = "🚊",
      /**
       * Emoji: 🏳️‍⚧️
       */
      "TRANSGENDER_FLAG" = "🏳️‍⚧️",
      /**
       * Emoji: ⚧
       */
      "TRANSGENDER_SYMBOL" = "⚧",
      /**
       * Emoji: 🚩
       */
      "TRIANGULAR_FLAG_ON_POST" = "🚩",
      /**
       * Emoji: 📐
       */
      "TRIANGULAR_RULER" = "📐",
      /**
       * Emoji: 🔱
       */
      "TRIDENT" = "🔱",
      /**
       * Emoji: 😤
       */
      "TRIUMPH" = "😤",
      /**
       * Emoji: 🚎
       */
      "TROLLEYBUS" = "🚎",
      /**
       * Emoji: 🏆
       */
      "TROPHY" = "🏆",
      /**
       * Emoji: 🍹
       */
      "TROPICAL_DRINK" = "🍹",
      /**
       * Emoji: 🐠
       */
      "TROPICAL_FISH" = "🐠",
      /**
       * Emoji: 🚚
       */
      "TRUCK" = "🚚",
      /**
       * Emoji: 🎺
       */
      "TRUMPET" = "🎺",
      /**
       * Emoji: 🌷
       */
      "TULIP" = "🌷",
      /**
       * Emoji: 🥃
       *
       * Aliases: `WHISKY`
       */
      "TUMBLER_GLASS" = "🥃",
      /**
       * Emoji: 🦃
       */
      "TURKEY" = "🦃",
      /**
       * Emoji: 🐢
       */
      "TURTLE" = "🐢",
      /**
       * Emoji: 📺
       */
      "TV" = "📺",
      /**
       * Emoji: 🔀
       */
      "TWISTED_RIGHTWARDS_ARROWS" = "🔀",
      /**
       * Emoji: 2️⃣
       */
      "TWO" = "2️⃣",
      /**
       * Emoji: 💕
       */
      "TWO_HEARTS" = "💕",
      /**
       * Emoji: 👬
       */
      "TWO_MEN_HOLDING_HANDS" = "👬",
      /**
       * Emoji: 👭
       */
      "TWO_WOMEN_HOLDING_HANDS" = "👭",
      /**
       * Emoji: 🦖
       */
      "T_REX" = "🦖",
      /**
       * Emoji: 🈹
       */
      "U5272" = "🈹",
      /**
       * Emoji: 🈴
       */
      "U5408" = "🈴",
      /**
       * Emoji: 🈺
       */
      "U55B6" = "🈺",
      /**
       * Emoji: 🈯
       */
      "U6307" = "🈯",
      /**
       * Emoji: 🈷️
       */
      "U6708" = "🈷️",
      /**
       * Emoji: 🈶
       */
      "U6709" = "🈶",
      /**
       * Emoji: 🈵
       */
      "U6E80" = "🈵",
      /**
       * Emoji: 🈚
       */
      "U7121" = "🈚",
      /**
       * Emoji: 🈸
       */
      "U7533" = "🈸",
      /**
       * Emoji: 🈲
       */
      "U7981" = "🈲",
      /**
       * Emoji: 🈳
       */
      "U7A7A" = "🈳",
      /**
       * Emoji: ☔
       */
      "UMBRELLA" = "☔",
      /**
       * Emoji: ☂️
       */
      "UMBRELLA2" = "☂️",
      /**
       * Emoji: ⛱️
       *
       * Aliases: `BEACH_UMBRELLA`
       */
      "UMBRELLA_ON_GROUND" = "⛱️",
      /**
       * Emoji: 😒
       */
      "UNAMUSED" = "😒",
      /**
       * Emoji: 🔞
       */
      "UNDERAGE" = "🔞",
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
       * Emoji: 🇺🇳
       */
      "UNITED_NATIONS" = "🇺🇳",
      /**
       * Emoji: 🔓
       */
      "UNLOCK" = "🔓",
      /**
       * Emoji: 🆙
       */
      "UP" = "🆙",
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
       * Emoji: ⚱️
       *
       * Aliases: `FUNERAL_URN`
       */
      "URN" = "⚱️",
      /**
       * Emoji: ✌️
       */
      "V" = "✌️",
      /**
       * Emoji: 🧛
       */
      "VAMPIRE" = "🧛",
      /**
       * Emoji: 🚦
       */
      "VERTICAL_TRAFFIC_LIGHT" = "🚦",
      /**
       * Emoji: 📼
       */
      "VHS" = "📼",
      /**
       * Emoji: 📳
       */
      "VIBRATION_MODE" = "📳",
      /**
       * Emoji: 📹
       */
      "VIDEO_CAMERA" = "📹",
      /**
       * Emoji: 🎮
       */
      "VIDEO_GAME" = "🎮",
      /**
       * Emoji: 🎻
       */
      "VIOLIN" = "🎻",
      /**
       * Emoji: ♍
       */
      "VIRGO" = "♍",
      /**
       * Emoji: 🌋
       */
      "VOLCANO" = "🌋",
      /**
       * Emoji: 🏐
       */
      "VOLLEYBALL" = "🏐",
      /**
       * Emoji: 🆚
       */
      "VS" = "🆚",
      /**
       * Emoji: 🖖
       *
       * Aliases: `RAISED_HAND_WITH_PART_BETWEEN_MIDDLE_AND_RING_FINGERS`
       */
      "VULCAN" = "🖖",
      /**
       * Emoji: 🧇
       */
      "WAFFLE" = "🧇",
      /**
       * Emoji: 🏴󠁧󠁢󠁷󠁬󠁳󠁿
       */
      "WALES" = "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
      /**
       * Emoji: 🚶
       *
       * Aliases: `PERSON_WALKING`
       */
      "WALKING" = "🚶",
      /**
       * Emoji: 🌘
       */
      "WANING_CRESCENT_MOON" = "🌘",
      /**
       * Emoji: 🌖
       */
      "WANING_GIBBOUS_MOON" = "🌖",
      /**
       * Emoji: ⚠️
       */
      "WARNING" = "⚠️",
      /**
       * Emoji: 🗑️
       */
      "WASTEBASKET" = "🗑️",
      /**
       * Emoji: ⌚
       */
      "WATCH" = "⌚",
      /**
       * Emoji: 🍉
       */
      "WATERMELON" = "🍉",
      /**
       * Emoji: 🐃
       */
      "WATER_BUFFALO" = "🐃",
      /**
       * Emoji: 🤽
       *
       * Aliases: `PERSON_PLAYING_WATER_POLO`
       */
      "WATER_POLO" = "🤽",
      /**
       * Emoji: 👋
       */
      "WAVE" = "👋",
      /**
       * Emoji: 〰️
       */
      "WAVY_DASH" = "〰️",
      /**
       * Emoji: 🌒
       */
      "WAXING_CRESCENT_MOON" = "🌒",
      /**
       * Emoji: 🌔
       */
      "WAXING_GIBBOUS_MOON" = "🌔",
      /**
       * Emoji: 🚾
       */
      "WC" = "🚾",
      /**
       * Emoji: 😩
       */
      "WEARY" = "😩",
      /**
       * Emoji: 💒
       */
      "WEDDING" = "💒",
      /**
       * Emoji: 🏋️
       *
       * Aliases: `PERSON_LIFTING_WEIGHTS`,`LIFTER`
       */
      "WEIGHT_LIFTER" = "🏋️",
      /**
       * Emoji: 🐳
       */
      "WHALE" = "🐳",
      /**
       * Emoji: 🐋
       */
      "WHALE2" = "🐋",
      /**
       * Emoji: ♿
       */
      "WHEELCHAIR" = "♿",
      /**
       * Emoji: ☸️
       */
      "WHEEL_OF_DHARMA" = "☸️",
      /**
       * Emoji: 🥃
       *
       * Aliases: `TUMBLER_GLASS`
       */
      "WHISKY" = "🥃",
      /**
       * Emoji: ✅
       */
      "WHITE_CHECK_MARK" = "✅",
      /**
       * Emoji: ⚪
       */
      "WHITE_CIRCLE" = "⚪",
      /**
       * Emoji: 💮
       */
      "WHITE_FLOWER" = "💮",
      /**
       * Emoji: ☹️
       *
       * Aliases: `FROWNING2`
       */
      "WHITE_FROWNING_FACE" = "☹️",
      /**
       * Emoji: 🤍
       */
      "WHITE_HEART" = "🤍",
      /**
       * Emoji: ⬜
       */
      "WHITE_LARGE_SQUARE" = "⬜",
      /**
       * Emoji: ◽
       */
      "WHITE_MEDIUM_SMALL_SQUARE" = "◽",
      /**
       * Emoji: ◻️
       */
      "WHITE_MEDIUM_SQUARE" = "◻️",
      /**
       * Emoji: ▫️
       */
      "WHITE_SMALL_SQUARE" = "▫️",
      /**
       * Emoji: 🔳
       */
      "WHITE_SQUARE_BUTTON" = "🔳",
      /**
       * Emoji: 🌥️
       *
       * Aliases: `WHITE_SUN_CLOUD`
       */
      "WHITE_SUN_BEHIND_CLOUD" = "🌥️",
      /**
       * Emoji: 🌦️
       *
       * Aliases: `WHITE_SUN_RAIN_CLOUD`
       */
      "WHITE_SUN_BEHIND_CLOUD_WITH_RAIN" = "🌦️",
      /**
       * Emoji: 🌥️
       *
       * Aliases: `WHITE_SUN_BEHIND_CLOUD`
       */
      "WHITE_SUN_CLOUD" = "🌥️",
      /**
       * Emoji: 🌦️
       *
       * Aliases: `WHITE_SUN_BEHIND_CLOUD_WITH_RAIN`
       */
      "WHITE_SUN_RAIN_CLOUD" = "🌦️",
      /**
       * Emoji: 🌤️
       *
       * Aliases: `WHITE_SUN_WITH_SMALL_CLOUD`
       */
      "WHITE_SUN_SMALL_CLOUD" = "🌤️",
      /**
       * Emoji: 🌤️
       *
       * Aliases: `WHITE_SUN_SMALL_CLOUD`
       */
      "WHITE_SUN_WITH_SMALL_CLOUD" = "🌤️",
      /**
       * Emoji: 🥀
       *
       * Aliases: `WILTED_ROSE`
       */
      "WILTED_FLOWER" = "🥀",
      /**
       * Emoji: 🥀
       *
       * Aliases: `WILTED_FLOWER`
       */
      "WILTED_ROSE" = "🥀",
      /**
       * Emoji: 🪟
       */
      "WINDOW" = "🪟",
      /**
       * Emoji: 🌬️
       */
      "WIND_BLOWING_FACE" = "🌬️",
      /**
       * Emoji: 🎐
       */
      "WIND_CHIME" = "🎐",
      /**
       * Emoji: 🍷
       */
      "WINE_GLASS" = "🍷",
      /**
       * Emoji: 😉
       */
      "WINK" = "😉",
      /**
       * Emoji: 🐺
       */
      "WOLF" = "🐺",
      /**
       * Emoji: 👩
       */
      "WOMAN" = "👩",
      /**
       * Emoji: 👚
       */
      "WOMANS_CLOTHES" = "👚",
      /**
       * Emoji: 🥿
       */
      "WOMANS_FLAT_SHOE" = "🥿",
      /**
       * Emoji: 👒
       */
      "WOMANS_HAT" = "👒",
      /**
       * Emoji: 👩‍🎨
       */
      "WOMAN_ARTIST" = "👩‍🎨",
      /**
       * Emoji: 👩‍🚀
       */
      "WOMAN_ASTRONAUT" = "👩‍🚀",
      /**
       * Emoji: 👩‍🦲
       */
      "WOMAN_BALD" = "👩‍🦲",
      /**
       * Emoji: 🚴‍♀️
       */
      "WOMAN_BIKING" = "🚴‍♀️",
      /**
       * Emoji: ⛹️‍♀️
       */
      "WOMAN_BOUNCING_BALL" = "⛹️‍♀️",
      /**
       * Emoji: 🙇‍♀️
       */
      "WOMAN_BOWING" = "🙇‍♀️",
      /**
       * Emoji: 🤸‍♀️
       */
      "WOMAN_CARTWHEELING" = "🤸‍♀️",
      /**
       * Emoji: 🧗‍♀️
       */
      "WOMAN_CLIMBING" = "🧗‍♀️",
      /**
       * Emoji: 👷‍♀️
       */
      "WOMAN_CONSTRUCTION_WORKER" = "👷‍♀️",
      /**
       * Emoji: 👩‍🍳
       */
      "WOMAN_COOK" = "👩‍🍳",
      /**
       * Emoji: 👩‍🦱
       */
      "WOMAN_CURLY_HAIRED" = "👩‍🦱",
      /**
       * Emoji: 🕵️‍♀️
       */
      "WOMAN_DETECTIVE" = "🕵️‍♀️",
      /**
       * Emoji: 🧝‍♀️
       */
      "WOMAN_ELF" = "🧝‍♀️",
      /**
       * Emoji: 🤦‍♀️
       */
      "WOMAN_FACEPALMING" = "🤦‍♀️",
      /**
       * Emoji: 👩‍🏭
       */
      "WOMAN_FACTORY_WORKER" = "👩‍🏭",
      /**
       * Emoji: 🧚‍♀️
       */
      "WOMAN_FAIRY" = "🧚‍♀️",
      /**
       * Emoji: 👩‍🌾
       */
      "WOMAN_FARMER" = "👩‍🌾",
      /**
       * Emoji: 👩‍🍼
       */
      "WOMAN_FEEDING_BABY" = "👩‍🍼",
      /**
       * Emoji: 👩‍🚒
       */
      "WOMAN_FIREFIGHTER" = "👩‍🚒",
      /**
       * Emoji: 🙍‍♀️
       */
      "WOMAN_FROWNING" = "🙍‍♀️",
      /**
       * Emoji: 🧞‍♀️
       */
      "WOMAN_GENIE" = "🧞‍♀️",
      /**
       * Emoji: 🙅‍♀️
       */
      "WOMAN_GESTURING_NO" = "🙅‍♀️",
      /**
       * Emoji: 🙆‍♀️
       */
      "WOMAN_GESTURING_OK" = "🙆‍♀️",
      /**
       * Emoji: 💆‍♀️
       */
      "WOMAN_GETTING_FACE_MASSAGE" = "💆‍♀️",
      /**
       * Emoji: 💇‍♀️
       */
      "WOMAN_GETTING_HAIRCUT" = "💇‍♀️",
      /**
       * Emoji: 🏌️‍♀️
       */
      "WOMAN_GOLFING" = "🏌️‍♀️",
      /**
       * Emoji: 💂‍♀️
       */
      "WOMAN_GUARD" = "💂‍♀️",
      /**
       * Emoji: 👩‍⚕️
       */
      "WOMAN_HEALTH_WORKER" = "👩‍⚕️",
      /**
       * Emoji: 🧘‍♀️
       */
      "WOMAN_IN_LOTUS_POSITION" = "🧘‍♀️",
      /**
       * Emoji: 👩‍🦽
       */
      "WOMAN_IN_MANUAL_WHEELCHAIR" = "👩‍🦽",
      /**
       * Emoji: 👩‍🦼
       */
      "WOMAN_IN_MOTORIZED_WHEELCHAIR" = "👩‍🦼",
      /**
       * Emoji: 🧖‍♀️
       */
      "WOMAN_IN_STEAMY_ROOM" = "🧖‍♀️",
      /**
       * Emoji: 🤵‍♀️
       */
      "WOMAN_IN_TUXEDO" = "🤵‍♀️",
      /**
       * Emoji: 👩‍⚖️
       */
      "WOMAN_JUDGE" = "👩‍⚖️",
      /**
       * Emoji: 🤹‍♀️
       */
      "WOMAN_JUGGLING" = "🤹‍♀️",
      /**
       * Emoji: 🧎‍♀️
       */
      "WOMAN_KNEELING" = "🧎‍♀️",
      /**
       * Emoji: 🏋️‍♀️
       */
      "WOMAN_LIFTING_WEIGHTS" = "🏋️‍♀️",
      /**
       * Emoji: 🧙‍♀️
       */
      "WOMAN_MAGE" = "🧙‍♀️",
      /**
       * Emoji: 👩‍🔧
       */
      "WOMAN_MECHANIC" = "👩‍🔧",
      /**
       * Emoji: 🚵‍♀️
       */
      "WOMAN_MOUNTAIN_BIKING" = "🚵‍♀️",
      /**
       * Emoji: 👩‍💼
       */
      "WOMAN_OFFICE_WORKER" = "👩‍💼",
      /**
       * Emoji: 👩‍✈️
       */
      "WOMAN_PILOT" = "👩‍✈️",
      /**
       * Emoji: 🤾‍♀️
       */
      "WOMAN_PLAYING_HANDBALL" = "🤾‍♀️",
      /**
       * Emoji: 🤽‍♀️
       */
      "WOMAN_PLAYING_WATER_POLO" = "🤽‍♀️",
      /**
       * Emoji: 👮‍♀️
       */
      "WOMAN_POLICE_OFFICER" = "👮‍♀️",
      /**
       * Emoji: 🙎‍♀️
       */
      "WOMAN_POUTING" = "🙎‍♀️",
      /**
       * Emoji: 🙋‍♀️
       */
      "WOMAN_RAISING_HAND" = "🙋‍♀️",
      /**
       * Emoji: 👩‍🦰
       */
      "WOMAN_RED_HAIRED" = "👩‍🦰",
      /**
       * Emoji: 🚣‍♀️
       */
      "WOMAN_ROWING_BOAT" = "🚣‍♀️",
      /**
       * Emoji: 🏃‍♀️
       */
      "WOMAN_RUNNING" = "🏃‍♀️",
      /**
       * Emoji: 👩‍🔬
       */
      "WOMAN_SCIENTIST" = "👩‍🔬",
      /**
       * Emoji: 🤷‍♀️
       */
      "WOMAN_SHRUGGING" = "🤷‍♀️",
      /**
       * Emoji: 👩‍🎤
       */
      "WOMAN_SINGER" = "👩‍🎤",
      /**
       * Emoji: 🧍‍♀️
       */
      "WOMAN_STANDING" = "🧍‍♀️",
      /**
       * Emoji: 👩‍🎓
       */
      "WOMAN_STUDENT" = "👩‍🎓",
      /**
       * Emoji: 🦸‍♀️
       */
      "WOMAN_SUPERHERO" = "🦸‍♀️",
      /**
       * Emoji: 🦹‍♀️
       */
      "WOMAN_SUPERVILLAIN" = "🦹‍♀️",
      /**
       * Emoji: 🏄‍♀️
       */
      "WOMAN_SURFING" = "🏄‍♀️",
      /**
       * Emoji: 🏊‍♀️
       */
      "WOMAN_SWIMMING" = "🏊‍♀️",
      /**
       * Emoji: 👩‍🏫
       */
      "WOMAN_TEACHER" = "👩‍🏫",
      /**
       * Emoji: 👩‍💻
       */
      "WOMAN_TECHNOLOGIST" = "👩‍💻",
      /**
       * Emoji: 💁‍♀️
       */
      "WOMAN_TIPPING_HAND" = "💁‍♀️",
      /**
       * Emoji: 🧛‍♀️
       */
      "WOMAN_VAMPIRE" = "🧛‍♀️",
      /**
       * Emoji: 🚶‍♀️
       */
      "WOMAN_WALKING" = "🚶‍♀️",
      /**
       * Emoji: 👳‍♀️
       */
      "WOMAN_WEARING_TURBAN" = "👳‍♀️",
      /**
       * Emoji: 👩‍🦳
       */
      "WOMAN_WHITE_HAIRED" = "👩‍🦳",
      /**
       * Emoji: 🧕
       */
      "WOMAN_WITH_HEADSCARF" = "🧕",
      /**
       * Emoji: 👩‍🦯
       */
      "WOMAN_WITH_PROBING_CANE" = "👩‍🦯",
      /**
       * Emoji: 👰‍♀️
       *
       * Aliases: `BRIDE_WITH_VEIL`
       */
      "WOMAN_WITH_VEIL" = "👰‍♀️",
      /**
       * Emoji: 🧟‍♀️
       */
      "WOMAN_ZOMBIE" = "🧟‍♀️",
      /**
       * Emoji: 🚺
       */
      "WOMENS" = "🚺",
      /**
       * Emoji: 👯‍♀️
       */
      "WOMEN_WITH_BUNNY_EARS_PARTYING" = "👯‍♀️",
      /**
       * Emoji: 🤼‍♀️
       */
      "WOMEN_WRESTLING" = "🤼‍♀️",
      /**
       * Emoji: 🪵
       */
      "WOOD" = "🪵",
      /**
       * Emoji: 🥴
       */
      "WOOZY_FACE" = "🥴",
      /**
       * Emoji: 🗺️
       *
       * Aliases: `MAP`
       */
      "WORLD_MAP" = "🗺️",
      /**
       * Emoji: 🪱
       */
      "WORM" = "🪱",
      /**
       * Emoji: 😟
       */
      "WORRIED" = "😟",
      /**
       * Emoji: 🛐
       *
       * Aliases: `PLACE_OF_WORSHIP`
       */
      "WORSHIP_SYMBOL" = "🛐",
      /**
       * Emoji: 🔧
       */
      "WRENCH" = "🔧",
      /**
       * Emoji: 🤼
       *
       * Aliases: `PEOPLE_WRESTLING`,`WRESTLING`
       */
      "WRESTLERS" = "🤼",
      /**
       * Emoji: 🤼
       *
       * Aliases: `PEOPLE_WRESTLING`,`WRESTLERS`
       */
      "WRESTLING" = "🤼",
      /**
       * Emoji: ✍️
       */
      "WRITING_HAND" = "✍️",
      /**
       * Emoji: ❌
       */
      "X" = "❌",
      /**
       * Emoji: 🧶
       */
      "YARN" = "🧶",
      /**
       * Emoji: 🥱
       */
      "YAWNING_FACE" = "🥱",
      /**
       * Emoji: 🟡
       */
      "YELLOW_CIRCLE" = "🟡",
      /**
       * Emoji: 💛
       */
      "YELLOW_HEART" = "💛",
      /**
       * Emoji: 🟨
       */
      "YELLOW_SQUARE" = "🟨",
      /**
       * Emoji: 💴
       */
      "YEN" = "💴",
      /**
       * Emoji: ☯️
       */
      "YIN_YANG" = "☯️",
      /**
       * Emoji: 🪀
       */
      "YO_YO" = "🪀",
      /**
       * Emoji: 😋
       */
      "YUM" = "😋",
      /**
       * Emoji: 🤪
       */
      "ZANY_FACE" = "🤪",
      /**
       * Emoji: ⚡
       */
      "ZAP" = "⚡",
      /**
       * Emoji: 🦓
       */
      "ZEBRA" = "🦓",
      /**
       * Emoji: 0️⃣
       */
      "ZERO" = "0️⃣",
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
       * Emoji: 🧟
       */
      "ZOMBIE" = "🧟",
      /**
       * Emoji: 💤
       */
      "ZZZ" = "💤",
      /**
       * Emoji: 👍
       *
       * Aliases: `THUMBSUP`,`THUMBUP`
       */
      "_+1" = "👍",
      /**
       * Emoji: 👎
       *
       * Aliases: `THUMBSDOWN`,`THUMBDOWN`
       */
      "_-1" = "👎",
      /**
       * Emoji: 💯
       */
      "_100" = "💯",
      /**
       * Emoji: 🔢
       */
      "_1234" = "🔢",
    }
  }
}
