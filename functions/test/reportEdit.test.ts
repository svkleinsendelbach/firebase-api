import { expect } from 'firebase-function/lib/src/testUtils';
import { Guid } from 'firebase-function';
import { authenticateTestUser, cleanUpFirebase, firebaseApp } from './firebaseApp';
import { UtcDate } from 'firebase-function';

describe('reportEdit', () => {
    beforeEach(async () => {
        await authenticateTestUser();
    });

    afterEach(async () => {
        await cleanUpFirebase();
    });

    it('remove report not existing', async () => {
        const reportId = Guid.newGuid();
        const result = await firebaseApp.functions.function('report').function('edit').call({
            editType: 'remove',
            groupId: 'general',
            previousGroupId: null,
            reportId: reportId.guidString,
            report: null
        });
        result.success;
    });

    it('remove report existing', async () => {
        const reportId = Guid.newGuid();
        await firebaseApp.database.child('reports').child('general').child(reportId.guidString).set({
            title: 'title',
            message: 'message',
            createDate: UtcDate.now.encoded,
            imageUrl: null,
            discordMessageId: null
        }, 'encrypt');
        const result = await firebaseApp.functions.function('report').function('edit').call({
            editType: 'remove',
            groupId: 'general',
            previousGroupId: null,
            reportId: reportId.guidString,
            report: null
        });
        result.success;
        expect(await firebaseApp.database.child('reports').child('general').child(reportId.guidString).exists()).to.be.equal(false);
    });

    it('add report not given over', async () => {
        const result = await firebaseApp.functions.function('report').function('edit').call({
            editType: 'add',
            groupId: 'general',
            previousGroupId: null,
            reportId: Guid.newGuid().guidString,
            report: null
        });
        result.failure.equal({
            code: 'invalid-argument',
            message: 'No report in parameters to add.'
        });
    });

    it('add report not existing', async () => {
        const reportId = Guid.newGuid();
        const date = UtcDate.now;
        const result = await firebaseApp.functions.function('report').function('edit').call({
            editType: 'add',
            groupId: 'general',
            previousGroupId: null,
            reportId: reportId.guidString,
            report: {
                title: 'title',
                message: 'message',
                createDate: date.encoded,
                imageUrl: null
            }
        });
        result.success;
        expect(await firebaseApp.database.child('reports').child('general').child(reportId.guidString).get('decrypt')).to.be.deep.equal({
            title: 'title',
            message: 'message',
            createDate: date.encoded,
            imageUrl: null,
            discordMessageId: null
        });
    });

    it('add report existing', async () => {
        const reportId = Guid.newGuid();
        const date1 = UtcDate.now;
        await firebaseApp.database.child('reports').child('general').child(reportId.guidString).set({
            title: 'title-1',
            message: 'message-1',
            createDate: date1.encoded,
            imageUrl: null,
            discordMessageId: null
        }, 'encrypt');
        const date2 = date1.advanced({ minute: 60 });
        const result = await firebaseApp.functions.function('report').function('edit').call({
            editType: 'add',
            groupId: 'general',
            previousGroupId: null,
            reportId: reportId.guidString,
            report: {
                title: 'title-2',
                message: 'message-2',
                imageUrl: 'image-url-2',
                createDate: date2.encoded
            }
        });
        result.failure.equal({
            code: 'invalid-argument',
            message: 'Couldn\'t add existing report.'
        });
    });

    it('change report not given over', async () => {
        const result = await firebaseApp.functions.function('report').function('edit').call({
            editType: 'change',
            groupId: 'general',
            previousGroupId: 'general',
            reportId: Guid.newGuid().guidString,
            report: null
        });
        result.failure.equal({
            code: 'invalid-argument',
            message: 'No report in parameters to change.'
        });
    });

    it('change report not existing', async () => {
        const reportId = Guid.newGuid();
        const date = UtcDate.now;
        const result = await firebaseApp.functions.function('report').function('edit').call({
            editType: 'change',
            groupId: 'general',
            previousGroupId: 'general',
            reportId: reportId.guidString,
            report: {
                title: 'title',
                message: 'message',
                imageUrl: 'image-url',
                createDate: date.encoded
            }
        });
        result.failure.equal({
            code: 'invalid-argument',
            message: 'Couldn\'t change not existing report.'
        });
    });

    it('change report existing', async () => {
        const reportId = Guid.newGuid();
        const date1 = UtcDate.now;
        await firebaseApp.database.child('reports').child('general').child(reportId.guidString).set({
            title: 'title-1',
            message: 'message-1',
            createDate: date1.encoded,
            imageUrl: null,
            discordMessageId: null
        }, 'encrypt');
        const date2 = date1.advanced({ minute: 60 });
        const result = await firebaseApp.functions.function('report').function('edit').call({
            editType: 'change',
            groupId: 'general',
            previousGroupId: 'general',
            reportId: reportId.guidString,
            report: {
                title: 'title-2',
                message: 'message-2',
                imageUrl: 'image-url-2',
                createDate: date2.encoded
            }
        });
        result.success;
        expect(await firebaseApp.database.child('reports').child('general').child(reportId.guidString).get('decrypt')).to.be.deep.equal({
            title: 'title-2',
            message: 'message-2',
            imageUrl: 'image-url-2',
            createDate: date2.encoded,
            discordMessageId: null
        });
    });

    it('change report previous group id null', async () => {
        const reportId = Guid.newGuid();
        const date1 = UtcDate.now;
        await firebaseApp.database.child('reports').child('general').child(reportId.guidString).set({
            title: 'title-1',
            message: 'message-1',
            imageUrl: null,
            createDate: date1.encoded,
            discordMessageId: null
        }, 'encrypt');
        const date2 = date1.advanced({ minute: 60 });
        const result = await firebaseApp.functions.function('report').function('edit').call({
            editType: 'change',
            groupId: 'football-adults/first-team',
            previousGroupId: null,
            reportId: reportId.guidString,
            report: {
                title: 'title-2',
                message: 'message-2',
                imageUrl: 'image-url-2',
                createDate: date2.encoded
            }
        });
        result.failure.equal({
            code: 'invalid-argument',
            message: 'No previous group id in parameters to change.'
        });
    });

    it('change report group id', async () => {
        const reportId = Guid.newGuid();
        const date1 = UtcDate.now;
        await firebaseApp.database.child('reports').child('general').child(reportId.guidString).set({
            title: 'title-1',
            message: 'message-1',
            createDate: date1.encoded,
            imageUrl: null,
            discordMessageId: null
        }, 'encrypt');
        const date2 = date1.advanced({ minute: 60 });
        const result = await firebaseApp.functions.function('report').function('edit').call({
            editType: 'change',
            groupId: 'football-adults/first-team',
            previousGroupId: 'general',
            reportId: reportId.guidString,
            report: {
                title: 'title-2',
                message: 'message-2',
                imageUrl: 'image-url-2',
                createDate: date2.encoded
            }
        });
        result.success;
        expect(await firebaseApp.database.child('reports').child('general').child(reportId.guidString).exists()).to.be.equal(false);
        expect(await firebaseApp.database.child('reports').child('football-adults/first-team').child(reportId.guidString).get('decrypt')).to.be.deep.equal({
            title: 'title-2',
            message: 'message-2',
            imageUrl: 'image-url-2',
            createDate: date2.encoded,
            discordMessageId: null
        });
    });
});
