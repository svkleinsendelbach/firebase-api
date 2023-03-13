import { expect } from 'firebase-function/lib/src/testUtils';
import { Guid } from '../src/types/Guid';
import { authenticateTestUser, cleanUpFirebase, firebaseApp } from './firebaseApp';

describe('reportEdit', () => {
    beforeEach(async () => {
        await authenticateTestUser();
    });

    afterEach(async () => {
        await cleanUpFirebase();
    });

    it('remove report not existing', async () => {
        const result = await firebaseApp.functions.function('report').function('edit').call({
            editType: 'remove',
            groupId: 'general',
            reportId: Guid.newGuid().guidString,
            report: undefined
        });
        result.success;
    });

    it('remove report existing', async () => {
        const reportId = Guid.newGuid();
        await firebaseApp.database.child('reports').child('general').child(reportId.guidString).set({
            title: 'title',
            message: 'message',
            createDate: new Date().toISOString()
        }, true);
        const result = await firebaseApp.functions.function('report').function('edit').call({
            editType: 'remove',
            groupId: 'general',
            reportId: Guid.newGuid().guidString,
            report: undefined
        });
        result.success;
        expect(await firebaseApp.database.child('events').child('general').child(reportId.guidString).exists()).to.be.equal(false);
    });

    it('add report not given over', async () => {
        const result = await firebaseApp.functions.function('report').function('edit').call({
            editType: 'add',
            groupId: 'general',
            reportId: Guid.newGuid().guidString,
            report: undefined
        });
        result.failure.equal({
            code: 'invalid-argument',
            message: 'No report in parameters to add / change.'
        });
    });

    it('add report not existing', async () => {
        const reportId = Guid.newGuid();
        const date = new Date();
        const result = await firebaseApp.functions.function('report').function('edit').call({
            editType: 'add',
            groupId: 'general',
            reportId: reportId.guidString,
            report: {
                title: 'title',
                message: 'message',
                createDate: date.toISOString()
            }
        });
        result.success;
        expect(await firebaseApp.database.child('reports').child('general').child(reportId.guidString).get(true)).to.be.deep.equal({
            title: 'title',
            message: 'message',
            createDate: date.toISOString()
        });
    });

    it('add report existing', async () => {
        const reportId = Guid.newGuid();
        const date1 = new Date();
        await firebaseApp.database.child('reports').child('general').child(reportId.guidString).set({
            title: 'title-1',
            message: 'message-1',
            createDate: date1.toISOString()
        }, true);
        const date2 = new Date(date1.getTime() + 60000);
        const result = await firebaseApp.functions.function('report').function('edit').call({
            editType: 'add',
            groupId: 'general',
            reportId: reportId.guidString,
            report: {
                title: 'title-2',
                message: 'message-2',
                createDate: date2.toISOString()
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
            reportId: Guid.newGuid().guidString,
            report: undefined
        });
        result.failure.equal({
            code: 'invalid-argument',
            message: 'No report in parameters to add / change.'
        });
    });

    it('change report not existing', async () => {
        const reportId = Guid.newGuid();
        const date = new Date();
        const result = await firebaseApp.functions.function('report').function('edit').call({
            editType: 'change',
            groupId: 'general',
            reportId: reportId.guidString,
            report: {
                title: 'title',
                message: 'message',
                createDate: date.toISOString()
            }
        });
        result.failure.equal({
            code: 'invalid-argument',
            message: 'Couldn\'t change not existing report.'
        });
    });

    it('change report existing', async () => {
        const reportId = Guid.newGuid();
        const date1 = new Date();
        await firebaseApp.database.child('reports').child('general').child(reportId.guidString).set({
            title: 'title-1',
            message: 'message-1',
            createDate: date1.toISOString()
        }, true);
        const date2 = new Date(date1.getTime() + 60000);
        const result = await firebaseApp.functions.function('report').function('edit').call({
            editType: 'change',
            groupId: 'general',
            reportId: reportId.guidString,
            report: {
                title: 'title-2',
                message: 'message-2',
                createDate: date2.toISOString()
            }
        });
        result.success;
        expect(await firebaseApp.database.child('reports').child('general').child(reportId.guidString).get(true)).to.be.deep.equal({
            title: 'title-2',
            message: 'message-2',
            createDate: date2.toISOString()
        });
    });
});