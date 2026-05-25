package models.openstreetmap;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.PropertyAccessor;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.inject.Inject;
import entities.Country;
import entities.Station;
import models.CountriesModel;
import models.GeocodingModel;
import utils.geometry.DistanceComparator;
import utils.geometry.SimplePoint;
import utils.geometry.Point;

import java.net.URI;
import java.net.URISyntaxException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.Map;

public class OpenStreetMapGeocodingModel implements GeocodingModel {
    private final HttpClient client;
    private static final ObjectMapper MAPPER;

    @Inject
    private CountriesModel countriesModel;

    static {
        MAPPER = new ObjectMapper();
        MAPPER.setVisibility(PropertyAccessor.ALL, JsonAutoDetect.Visibility.NONE);
        MAPPER.setVisibility(PropertyAccessor.GETTER, JsonAutoDetect.Visibility.NONE);
        MAPPER.setVisibility(PropertyAccessor.IS_GETTER, JsonAutoDetect.Visibility.NONE);
        MAPPER.setVisibility(PropertyAccessor.SETTER, JsonAutoDetect.Visibility.NONE);
        MAPPER.setVisibility(PropertyAccessor.CREATOR, JsonAutoDetect.Visibility.NONE);
        MAPPER.setVisibility(PropertyAccessor.FIELD, JsonAutoDetect.Visibility.ANY);
        MAPPER.setSerializationInclusion(JsonInclude.Include.NON_NULL);
        MAPPER.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }

    public OpenStreetMapGeocodingModel() {
        client = HttpClient.newBuilder().followRedirects(HttpClient.Redirect.NORMAL).build();
    }

    private <T> Function<HttpResponse<byte[]>, T> jsonResponseHandler(TypeReference<T> responseType) {
        return httpResponse -> {
            if (httpResponse.statusCode() == 404) {
                return null;
            }
            if (httpResponse.statusCode() < 200 || httpResponse.statusCode() >= 300) {
                throw new CompletionException("HTTP response " + httpResponse.statusCode(), null);
            }
            try {
                return httpResponse.body() == null ? null : MAPPER.readValue(httpResponse.body(), responseType);
            } catch (Exception e) {
                throw new CompletionException(e);
            }
        };
    }

    @Override
    public CompletableFuture<Country> getCountryByPoint(Point point) {
        URI uri;
        try {
            uri = new URI("https://nominatim.openstreetmap.org/reverse?lat=" + point.getLat() + "&lon=" + point.getLng() + "&format=json");
        } catch (URISyntaxException e) {
            throw new RuntimeException(e);
        }
        HttpRequest req = HttpRequest.newBuilder(uri).header("User-Agent", "bahnbilder.ch").build();
        return client.sendAsync(req, java.net.http.HttpResponse.BodyHandlers.ofByteArray())
                .thenApply(jsonResponseHandler(new TypeReference<NominatimResponse>() {}))
                .thenApply(nr -> {
                    if (nr != null && nr.address != null && nr.address.country_code != null) {
                        return countriesModel.getByCode(nr.address.country_code.toUpperCase());
                    } else {
                        return null;
                    }
                });
    }

    @Override
    public List<Station> getNearbyStations(Point point) {
        List<Integer> distances = List.of(2500, 5000, 10000, 25000, 50000);
        for (int distance : distances) {
            URI uri;
            try {
                String query = "[out:json];node(around:" + distance + "," + point.getLat() + "," + point.getLng() + ")[railway=station];out;";
                uri = new URI("https://overpass-api.de/api/interpreter?data=" + java.net.URLEncoder.encode(query, "UTF-8"));
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
            HttpRequest req = HttpRequest.newBuilder(uri).header("User-Agent", "bahnbilder.ch").build();
            try {
                OverpassResponse r = client.sendAsync(req, java.net.http.HttpResponse.BodyHandlers.ofByteArray())
                        .thenApply(jsonResponseHandler(new TypeReference<OverpassResponse>() {}))
                        .get();
                if (r != null && r.elements != null && r.elements.size() >= 3) {
                    return r.elements.stream()
                            .filter(e -> e.tags != null && e.tags.name != null)
                            .map(e -> new Station(e.tags.name, new SimplePoint(e.lat, e.lon)))
                            .sorted(new DistanceComparator(point))
                            .collect(Collectors.toUnmodifiableList());
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        return Collections.emptyList();
    }

    private static class NominatimResponse {
        NominatimAddress address;
    }

    private static class NominatimAddress {
        String country_code;
    }

    private static class OverpassResponse {
        List<OverpassElement> elements;
    }

    private static class OverpassElement {
        Double lat;
        Double lon;
        OverpassTags tags;
    }

    private static class OverpassTags {
        String name;
    }
}
