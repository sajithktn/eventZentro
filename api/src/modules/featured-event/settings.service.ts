import { IFeaturedEventSetting } from "./featured-event.interface";
import FeaturedEventSetting from "./featured-event-setting.model";
import { UpdateFeaturedEventSettingsInput } from "./featured-event.validation";

import { DEFAULT_HOMEPAGE_LIMIT, FEATURED_EVENT_SETTING_ID } from "./constants";
import { FeaturedEventServiceError } from "./types";

export const getFeaturedEventSettingsService = async (): Promise<IFeaturedEventSetting> => {
    const setting = await FeaturedEventSetting.findByIdAndUpdate(FEATURED_EVENT_SETTING_ID, {
        $setOnInsert: {
            promotionFee: 0,
            isPromotionEnabled: true,
            maximumFeaturedEventsOnHomepage: DEFAULT_HOMEPAGE_LIMIT,
            requirePaymentBeforeApproval: true,
        },
    }, {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
    });
    if (!setting) {
        throw new FeaturedEventServiceError("Unable to load featured event settings.", 500);
    }
    return setting;
};

export const updateFeaturedEventSettingsService = async (data: UpdateFeaturedEventSettingsInput): Promise<IFeaturedEventSetting> => {
    const setting = await getFeaturedEventSettingsService();
    setting.promotionFee = data.promotionFee;
    setting.isPromotionEnabled =
        data.isPromotionEnabled;
    setting.maximumFeaturedEventsOnHomepage =
        data.maximumFeaturedEventsOnHomepage;
    setting.requirePaymentBeforeApproval =
        data.requirePaymentBeforeApproval;
    setting.defaultPromotionDurationDays =
        data.defaultPromotionDurationDays;
    await setting.save();
    return setting;
};
