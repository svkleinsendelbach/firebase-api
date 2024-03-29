import { HttpsError, type ILogger, UtcDate, Guid } from 'firebase-function';
import { EmbedBuilder } from 'discord.js';

export type EventGroupId =
    'general' |
    'football-adults/general' |
    'football-adults/first-team' |
    'football-adults/second-team' |
    'football-adults/ah-team' |
    'football-youth/general' |
    'football-youth/a-youth' |
    'football-youth/b-youth' |
    'football-youth/c-youth' |
    'football-youth/d-youth' |
    'football-youth/e-youth' |
    'football-youth/f-youth' |
    'football-youth/g-youth' |
    'gymnastics' |
    'dancing';

export namespace EventGroupId {
    export const all: EventGroupId[] = [
        'general', 'football-adults/general', 'football-adults/first-team', 'football-adults/second-team',
        'football-adults/ah-team', 'football-youth/general', 'football-youth/a-youth', 'football-youth/b-youth', 'football-youth/c-youth', 'football-youth/d-youth', 'football-youth/e-youth',
        'football-youth/f-youth', 'football-youth/g-youth', 'gymnastics', 'dancing'
    ];

    export const title: Record<EventGroupId, string> = {
        'dancing': 'Tanzen',
        'football-adults/ah-team': 'Alte Herren',
        'football-adults/first-team': '1. Mannschaft',
        'football-adults/general': 'Herrenfußball',
        'football-adults/second-team': '2. Mannschaft',
        'football-youth/a-youth': 'A-Jugend',
        'football-youth/b-youth': 'B-Jugend',
        'football-youth/c-youth': 'C-Jugend',
        'football-youth/d-youth': 'D-Jugend',
        'football-youth/e-youth': 'E-Jugend',
        'football-youth/f-youth': 'F-Jugend',
        'football-youth/g-youth': 'G-Jugend',
        'football-youth/general': 'Jugendfußball',
        'general': 'Allgemeines',
        'gymnastics': 'Gymnastik'
    };

    export function typeGuard(value: string): value is EventGroupId {
        return (EventGroupId.all as string[]).includes(value);
    }

    export function decodeSelectedGroupIds(selection: string): EventGroupId[] {
        const selectionNumber = Number.parseInt(selection, 16);
        const groupIds: EventGroupId[] = [];
        for (const [index, groupId] of EventGroupId.all.map((groupId, index) => [index, groupId] as const)) {
            if ((selectionNumber & (0b1 << index)) !== 0)
                groupIds.push(groupId);
        }
        return groupIds;
    }
}

export type Event = {
    id: Guid;
    date: UtcDate;
    title: string;
    isImportant: boolean;
    subtitle: string | null;
    link: string | null;
    discordMessageId: string | null;
};

export namespace Event {
    export function fromObject(value: object | null, logger: ILogger): Omit<Event, 'id' | 'discordMessageId'> {
        logger.log('Event.fromObject', { value: value });

        if (value === null)
            throw HttpsError('internal', 'Couldn\'t get event from null.', logger);

        if (!('date' in value) || typeof value.date !== 'string')
            throw HttpsError('internal', 'Couldn\'t get date for event.', logger);

        if (!('title' in value) || typeof value.title !== 'string')
            throw HttpsError('internal', 'Couldn\'t get title for event.', logger);

        if (!('isImportant' in value) || typeof value.isImportant !== 'boolean')
            throw HttpsError('internal', 'Couldn\'t get is important for event.', logger);

        if (!('subtitle' in value) || !(typeof value.subtitle === 'string' || value.subtitle === null))
            throw HttpsError('internal', 'Couldn\'t get subtitle for event.', logger);

        if (!('link' in value) || !(typeof value.link === 'string' || value.link === null))
            throw HttpsError('internal', 'Couldn\'t get link for event.', logger);

        return {
            date: UtcDate.decode(value.date),
            title: value.title,
            isImportant: value.isImportant,
            subtitle: value.subtitle,
            link: value.link
        };
    }

    export type Flatten = {
        id: string;
        date: string;
        title: string;
        isImportant: boolean;
        subtitle: string | null;
        link: string | null;
        discordMessageId: string | null;
    };

    export function flatten(event: Event): Event.Flatten;
    export function flatten(event: Omit<Event, 'id'>): Omit<Event.Flatten, 'id'>;
    export function flatten(event: Event | Omit<Event, 'id'>): Event.Flatten | Omit<Event.Flatten, 'id'> {
        return {
            ...('id' in event ? { id: event.id.guidString } : {}),
            date: event.date.encoded,
            title: event.title,
            isImportant: event.isImportant,
            subtitle: event.subtitle,
            link: event.link,
            discordMessageId: event.discordMessageId
        };
    }

    export function concrete(event: Event.Flatten): Event;
    export function concrete(event: Omit<Event.Flatten, 'id'>): Omit<Event, 'id'>;
    export function concrete(event: Event.Flatten | Omit<Event.Flatten, 'id'>): Event | Omit<Event, 'id'> {
        return {
            ...('id' in event ? { id: new Guid(event.id) } : {}),
            date: UtcDate.decode(event.date),
            title: event.title,
            isImportant: event.isImportant,
            subtitle: event.subtitle,
            link: event.link,
            discordMessageId: event.discordMessageId
        };
    }

    export function addDiscordMessageId(event: Omit<Event, 'discordMessageId'>, discordMessageId: string | null): Event;
    export function addDiscordMessageId(event: Omit<Event, 'id' | 'discordMessageId'>, discordMessageId: string | null): Omit<Event, 'id'>;
    export function addDiscordMessageId(event: Omit<Event, 'discordMessageId'> | Omit<Event, 'id' | 'discordMessageId'>, discordMessageId: string | null): Event | Omit<Event, 'id'> {
        return {
            ...event,
            discordMessageId: discordMessageId
        };
    }

    export function discordEmbed(event: Omit<Event, 'id' | 'discordMessageId'>, groupId: EventGroupId): EmbedBuilder {
        return new EmbedBuilder()
            .setColor(event.isImportant ? 0xE55604 : null)
            .setTitle(`${event.date.description('de-DE', 'Europe/Berlin')} | ${EventGroupId.title[groupId]} | ${event.title}`)
            .setURL(event.link)
            .setDescription(event.subtitle)
            .setTimestamp(event.date.toDate);
    }
}

export type EventGroup = {
    groupId: EventGroupId;
    events: Omit<Event, 'discordMessageId'>[];
};

export namespace EventGroup {
    export type Flatten = {
        groupId: EventGroupId;
        events: Omit<Event.Flatten, 'discordMessageId'>[];
    };
}
