import { type CryptedScheme, type DatabaseSchemeType } from 'firebase-function';
import { type AnpfiffTeamParameter } from './types/AnpfiffTeamParameter';
import { type Event, type EventGroupId } from './types/Event';
import { type News } from './types/News';
import { type UserAuthentication, type UserAuthenticationType } from './types/UserAuthentication';

export type DatabaseScheme = DatabaseSchemeType<{
    anpfiffTeamParameter: {
        [Key in AnpfiffTeamParameter.Type]: AnpfiffTeamParameter
    };
    events: {
        [Key in EventGroupId]: {
            [Key in string]: CryptedScheme<Omit<Event.Flatten, 'id'>>
        }
    };
    news: {
        [Key in string]: CryptedScheme<Omit<News.Flatten, 'id'>>
    };
    users: {
        authentication: {
            [Key in UserAuthenticationType]: {
                [Key in string]: CryptedScheme<UserAuthentication>
            };
        };
    };
}>;