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

export const User = {
    Id: true,
    Username: true,
    Email: true,
    Created: true,
    EmailVerified: true,
    IsActive: true,
    Url: {
        select: {
            Id: true,
            ShortUrl: true,
            LongUrl: true,
            IsActive: true,
            Clicks: true,
        },
    },
};

export const Plan = {
    Id: true,
    Name: true,
    Price: true,
    MaxUrls: true,
    MaxClicks: true,
    CustomSlug: true,
    Analytics: true,
    AnnualPrice: true,
};
