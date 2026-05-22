export const History = {
    Id: true,
    ChangedById: true,
    Action: true,
    PreviousLongUrl: true,
    NewLongUrl: true,
    PreviousExpiration: true,
    NewExpiration: true,
    ChangedAt: true,
};

export const Url = {
    Id: true,
    LongUrl: true,
    ShortUrl: true,
    IsActive: true,
    Clicks: true,
    ExpiresAt: true,
    Created: true,
    Updated: true,
    History: {
        select: History,
    },
};
