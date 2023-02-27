import { type DatabaseType, type FirebaseFunction, type ILogger, ParameterBuilder, ParameterContainer, ParameterParser, DatabaseReference, HttpsError } from 'firebase-function';
import { type AuthData } from 'firebase-functions/lib/common/providers/tasks';
import { checkUserAuthentication } from '../checkUserAuthentication';
import { Guid } from '../classes/Guid';
import { type DatabaseScheme } from '../DatabaseScheme';
import { getCryptionKeys, getDatabaseUrl } from '../privateKeys';
import { EditType } from '../types/EditType';
import { Event, EventGroupId } from '../types/Event';

export class EventEditFunction implements FirebaseFunction<EventEditFunction.Parameters, EventEditFunction.ReturnType> {
    public readonly parameters: EventEditFunction.Parameters & { databaseType: DatabaseType };

    public constructor(data: Record<string, unknown> & { databaseType: DatabaseType }, private readonly auth: AuthData | undefined, private readonly logger: ILogger) {
        this.logger.log('EventEditFunction.constructor', { data: data, auth: auth }, 'notice');
        const parameterContainer = new ParameterContainer(data, getCryptionKeys, this.logger.nextIndent);
        const parameterParser = new ParameterParser<EventEditFunction.Parameters>(
            {
                editType: ParameterBuilder.guard('string', EditType.typeGuard),
                groupId: ParameterBuilder.guard('string', EventGroupId.typeGuard),
                eventId: ParameterBuilder.build('string', Guid.fromString),
                event: ParameterBuilder.optional(ParameterBuilder.build('object', Event.fromObject))
            },
            this.logger.nextIndent
        );
        parameterParser.parseParameters(parameterContainer);
        this.parameters = parameterParser.parameters;
    }

    public async executeFunction(): Promise<EventEditFunction.ReturnType> {
        this.logger.log('EventEditFunction.executeFunction', {}, 'info');
        await checkUserAuthentication(this.auth, 'websiteEditing', this.parameters.databaseType, this.logger);
        const reference = DatabaseReference.base<DatabaseScheme>(getDatabaseUrl(this.parameters.databaseType), getCryptionKeys(this.parameters.databaseType)).child('events').child(this.parameters.groupId).child(this.parameters.eventId.guidString);
        const snapshot = await reference.snapshot();
        if (this.parameters.editType === 'remove') {
            if (snapshot.exists)
                await reference.remove();
        } else {
            if (this.parameters.event === undefined)
                throw HttpsError('invalid-argument', 'No event in parameters to add / change.', this.logger);
            if (this.parameters.editType === 'add' && snapshot.exists)
                throw HttpsError('invalid-argument', 'Couldn\'t add existing event.', this.logger);
            if (this.parameters.editType === 'change' && !snapshot.exists)
                throw HttpsError('invalid-argument', 'Couldn\'t change not existing event.', this.logger);
            await reference.set(Event.flatten(this.parameters.event), true);
        }
    }
}

export namespace EventEditFunction {
    export type Parameters = {
        editType: EditType;
        groupId: EventGroupId;
        eventId: Guid;
        event: Omit<Event, 'id'> | undefined;
    };

    export namespace Parameters {
        export type Flatten = {
            editType: EditType;
            groupId: EventGroupId;
            eventId: string;
            event: Omit<Event.Flatten, 'id'> | undefined;
        };
    }

    export type ReturnType = void;
}