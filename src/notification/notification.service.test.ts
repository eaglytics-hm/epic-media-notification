import { getData, notificationService } from './notification.service';

it('getData', async () => {
    const [batchedAt, rows] = await getData();
    expect(rows).toBeDefined();
});

it('notificationService', async () => {
    return await notificationService().catch((error) => {
        throw error;
    });
});
