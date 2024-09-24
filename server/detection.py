from datetime import timedelta
from typing import List
from models import GlucoseReading


def time_ranges_hyperglycemic(data: List[GlucoseReading], threshold):
    hyperglycemic_ranges = []
    start = None
    for i in range(len(data)):
        if data[i].glucose_value > threshold:
            if start is None:
                start = data[i].timestamp
        else:
            if start is not None:
                hyperglycemic_ranges.append((start, data[i].timestamp))
                start = None
    return hyperglycemic_ranges


def time_ranges_hypoglycemic(data: List[GlucoseReading], threshold):
    hypoglycemic_ranges = []
    start = None
    for i in range(len(data)):
        if data[i].glucose_value < threshold:
            if start is None:
                start = data[i].timestamp
        else:
            if start is not None:
                hypoglycemic_ranges.append((start, data[i].timestamp))
                start = None
    return hypoglycemic_ranges


def rate_of_change(data: List[GlucoseReading], window_size: int = 3) -> List[float]:
    rates = []
    for i in range(len(data) - window_size + 1):
        window = data[i : i + window_size]
        time_diff = (
            window[-1].timestamp - window[0].timestamp
        ).total_seconds() / 60  # in minutes
        glucose_diff = window[-1].glucose_value - window[0].glucose_value
        rate = glucose_diff / time_diff if time_diff > 0 else 0
        rates.append(rate)
    return rates


def time_ranges_rate_of_change(
    data: List[GlucoseReading], threshold: float, rising: bool = True
):
    rates = rate_of_change(data)
    ranges = []
    curr_start = None

    for i, rate in enumerate(rates):
        if (rising and rate > threshold) or (not rising and rate < -threshold):
            if curr_start is None:
                curr_start = data[i].timestamp
        else:
            if curr_start is not None:
                ranges.append(
                    (curr_start, data[i + 2].timestamp)
                )  # +2 because of the window size
                curr_start = None

    # Handle the case where the last range extends to the end of the data
    if curr_start is not None:
        ranges.append((curr_start, data[-1].timestamp))

    return ranges


def time_ranges_raising_quickly(data: List[GlucoseReading], threshold: float):
    return time_ranges_rate_of_change(data, threshold, rising=True)


def time_ranges_dropping_quickly(data: List[GlucoseReading], threshold: float):
    return time_ranges_rate_of_change(data, threshold, rising=False)


# threshold is in mg/dL/min. note sample data is in mg/dL/5min, so threshold is multiplied by 5
def time_ranges_raising_quickly(data: List[GlucoseReading], threshold):
    threshold *= 5
    quickly_raising_ranges = []
    curr_low = None
    for i in range(1, len(data)):
        if data[i].glucose_value - data[i - 1].glucose_value > threshold:
            if curr_low is None:
                curr_low = data[i - 1].timestamp
        else:
            if curr_low is not None:
                quickly_raising_ranges.append((curr_low, data[i].timestamp))
                curr_low = None
    return quickly_raising_ranges


# threshold is in mg/dL/min. note sample data is in mg/dL/5min, so threshold is multiplied by 5
def time_ranges_dropping_quickly(data: List[GlucoseReading], threshold):
    threshold *= 5
    quickly_dropping_ranges = []
    curr_high = None
    for i in range(1, len(data)):
        if data[i - 1].glucose_value - data[i].glucose_value > threshold:
            if curr_high is None:
                curr_high = data[i - 1].timestamp
        else:
            if curr_high is not None:
                quickly_dropping_ranges.append((curr_high, data[i].timestamp))
                curr_high = None
    return quickly_dropping_ranges


# everything in mg/dL (or mg/dL/min).
# note that each time range is likely caused by
# an event ~20-30 minutes before the start of the range
def time_ranges_of_interest(
    data: List[GlucoseReading],
    hyperglycemic_threshold=180,
    hypoglycemic_threshold=70,
    quickly_raising_threshold=2,
    quickly_dropping_threshold=2,
):
    hyperglycemic_ranges = time_ranges_hyperglycemic(data, hyperglycemic_threshold)
    hypoglycemic_ranges = time_ranges_hypoglycemic(data, hypoglycemic_threshold)
    quickly_raising_ranges = time_ranges_raising_quickly(
        data, quickly_raising_threshold
    )
    quickly_dropping_ranges = time_ranges_dropping_quickly(
        data, quickly_dropping_threshold
    )
    return {
        "hyperglycemic": hyperglycemic_ranges,
        "hypoglycemic": hypoglycemic_ranges,
        "quickly_raising": quickly_raising_ranges,
        "quickly_dropping": quickly_dropping_ranges,
    }

# returns a dictionary of lists of interesting events
# each list corresponds to a single time range, and contains
# all events that could have caused the glucose readings
def interesting_events(times, events, lookback_minutes=20):
    interesting_events = {}
    window = timedelta(minutes=lookback_minutes)
    for type, ranges in times.items():
        # subtract 20 minutes from the start and end of each time range
        t = [
            (start - window, end - window)
            for start, end in ranges
        ]

        # find all events that occurred within the time range
        events_in_range = []
        for start, end in t:
            hmmm = [event for event in events if start <= event.timestamp <= end]
            if hmmm:
                events_in_range.append({
                    "range": (start + window, end + window),
                    "events": hmmm
                })

        interesting_events[type] = events_in_range

    return interesting_events
