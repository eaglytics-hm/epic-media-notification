import { getLogger } from './logging.service';
import { notificationService } from './notification/notification.service';

const logger = getLogger(__filename);

['SIGINT', 'SIGTERM'].forEach((signal) => {
    process.once(signal, () => {
        logger.debug(signal);
        process.exit(0);
    });
});

notificationService()
    .then((results) => {
        logger.info('Completed', { results });
        process.exit(0);
    })
    .catch((error) => {
        logger.error('Error', { error });
        process.exit(1);
    });
